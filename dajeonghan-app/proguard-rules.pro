# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Firebase Auth
-keep class com.google.firebase.auth.** { *; }
-keep class com.google.firebase.auth.internal.** { *; }

# Firebase Firestore
-keep class com.google.firebase.firestore.** { *; }

# Firebase Storage
-keep class com.google.firebase.storage.** { *; }

# Firebase Messaging (FCM)
-keep class com.google.firebase.messaging.** { *; }

# Firebase Analytics
-keep class com.google.firebase.analytics.** { *; }

# Kakao SDK
-keep class com.kakao.** { *; }
-dontwarn com.kakao.**
-keep class com.kakao.sdk.** { *; }

# Naver Login SDK
-keep class com.nhn.android.naverlogin.** { *; }
-dontwarn com.nhn.android.naverlogin.**

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**

# Expo
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# OkHttp (네트워크)
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Retrofit
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }

# Gson (JSON 직렬화)
-keep class com.google.gson.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
