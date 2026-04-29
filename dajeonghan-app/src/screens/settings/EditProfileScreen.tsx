import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile } from '@/services/firestoreService';
import {
  updateProfile,
  uploadProfileImage,
  isUsernameAvailable,
  setUsername as saveUsername,
  USERNAME_REGEX,
} from '@/services/profileService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import type { MyInfoStackParamList } from '@/navigation/MyInfoNavigator';

type NavigationProp = StackNavigationProp<MyInfoStackParamList, 'EditProfile'>;

interface Props {
  navigation: NavigationProp;
}

const BIO_MAX = 100;

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { userId } = useAuth();
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState<string | undefined>();
  const [localImageUri, setLocalImageUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const displayNameRef = useRef<TextInput>(null);
  const bioRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const profile = await getUserProfile(userId);
        if (profile) {
          setUsername(profile.username ?? '');
          setOriginalUsername(profile.username ?? '');
          setDisplayName(profile.displayName ?? '');
          setBio(profile.bio ?? '');
          setPhotoURL(profile.photoURL);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const handleUsernameChange = (text: string) => {
    const normalized = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(normalized);
    setUsernameStatus('idle');
  };

  const checkUsername = useCallback(async () => {
    if (!username) {
      setUsernameStatus('idle');
      return;
    }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameStatus('invalid');
      return;
    }
    if (username === originalUsername) {
      setUsernameStatus('available');
      return;
    }
    setUsernameStatus('checking');
    try {
      const available = await isUsernameAvailable(username);
      setUsernameStatus(available ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  }, [username, originalUsername]);

  const pickImage = async (source: 'gallery' | 'camera') => {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'gallery') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    } else {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0]) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const handleAvatarPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['취소', '사진 라이브러리', '카메라'],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) pickImage('gallery');
          if (idx === 2) pickImage('camera');
        }
      );
    } else {
      Alert.alert('프로필 사진', '', [
        { text: '취소', style: 'cancel' },
        { text: '사진 라이브러리', onPress: () => pickImage('gallery') },
        { text: '카메라', onPress: () => pickImage('camera') },
      ]);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    if (username && !USERNAME_REGEX.test(username)) {
      Alert.alert('아이디 오류', '아이디는 영소문자, 숫자, 언더스코어만 사용 가능하며 3~20자여야 합니다.');
      return;
    }

    if (username && username !== originalUsername && usernameStatus !== 'available') {
      if (usernameStatus === 'taken') {
        Alert.alert('아이디 오류', '이미 사용 중인 아이디입니다.');
      } else {
        Alert.alert('아이디 오류', '아이디 중복 확인을 완료해주세요.');
      }
      return;
    }

    setSaving(true);
    try {
      console.log('[EditProfile] handleSave 시작', { userId, username, originalUsername, usernameStatus });

      let finalPhotoURL = photoURL;

      if (localImageUri) {
        console.log('[EditProfile] 이미지 업로드 시작');
        finalPhotoURL = await uploadProfileImage(userId, localImageUri);
        console.log('[EditProfile] 이미지 업로드 완료', finalPhotoURL);
      }

      console.log('[EditProfile] updateProfile 호출', { displayName: displayName.trim(), bio: bio.trim() });
      await updateProfile(userId, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL: finalPhotoURL,
      });
      console.log('[EditProfile] updateProfile 완료');

      if (username && username !== originalUsername) {
        console.log('[EditProfile] saveUsername 호출', { username, originalUsername });
        await saveUsername(userId, username, originalUsername || undefined);
        console.log('[EditProfile] saveUsername 완료');
      }

      navigation.goBack();
    } catch (e: any) {
      console.error('[EditProfile] 저장 실패', e?.code, e?.message, e);
      Alert.alert('오류', `저장에 실패했습니다.\n${e?.message ?? ''}`);
    } finally {
      setSaving(false);
    }
  };

  const avatarUri = localImageUri ?? photoURL;
  const initials = displayName ? displayName.charAt(0).toUpperCase() : '나';

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 아바타 */}
          <View style={styles.avatarWrapper}>
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{initials}</Text>
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarBadgeText}>편집</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 입력 폼 */}
          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>아이디</Text>
            <View style={styles.usernameRow}>
              <TextInput
                style={[styles.input, styles.usernameInput]}
                value={username}
                onChangeText={handleUsernameChange}
                onBlur={checkUsername}
                placeholder="영소문자, 숫자, _ (3~20자)"
                placeholderTextColor={Colors.textDisabled}
                returnKeyType="next"
                onSubmitEditing={() => displayNameRef.current?.focus()}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
              {usernameStatus === 'checking' && (
                <ActivityIndicator size="small" color={Colors.primary} style={styles.usernameIndicator} />
              )}
            </View>
            {usernameStatus === 'available' && (
              <Text style={styles.usernameHint}>사용 가능한 아이디입니다.</Text>
            )}
            {usernameStatus === 'taken' && (
              <Text style={[styles.usernameHint, styles.usernameHintError]}>이미 사용 중인 아이디입니다.</Text>
            )}
            {usernameStatus === 'invalid' && (
              <Text style={[styles.usernameHint, styles.usernameHintError]}>영소문자, 숫자, 언더스코어(_)만 사용 가능하며 3~20자여야 합니다.</Text>
            )}

            <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>닉네임</Text>
            <TextInput
              ref={displayNameRef}
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor={Colors.textDisabled}
              returnKeyType="next"
              onSubmitEditing={() => bioRef.current?.focus()}
              maxLength={20}
            />

            <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>자기소개</Text>
            <TextInput
              ref={bioRef}
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
              placeholder="자기소개를 입력하세요 (최대 100자)"
              placeholderTextColor={Colors.textDisabled}
              multiline
              numberOfLines={3}
              returnKeyType="done"
            />
            <Text style={styles.bioCounter}>{bio.length} / {BIO_MAX}</Text>
          </View>

          {/* 저장 버튼 */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>저장</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  /* 아바타 */
  avatarWrapper: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.full,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...Typography.h1,
    color: Colors.primary,
    fontWeight: '700',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  avatarBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },

  /* 폼 */
  formSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  fieldLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.body.fontWeight,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    backgroundColor: Colors.background,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  bioCounter: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameInput: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
  },
  usernameIndicator: {
    marginLeft: Spacing.sm,
  },
  usernameHint: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: 4,
  },
  usernameHintError: {
    color: Colors.error,
  },

  /* 저장 버튼 */
  saveButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '700',
  },
});
