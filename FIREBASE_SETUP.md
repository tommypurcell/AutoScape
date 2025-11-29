# Firebase Console Setup Guide

Follow these steps to complete your Firebase setup:

## 1. Enable Authentication

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Build** → **Authentication**
4. Click **Get Started**
5. Enable these sign-in methods:
   - **Google**: Toggle ON, add support email
   - **Email/Password**: Toggle ON

## 2. Create Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select your preferred location (choose closest to your users)
5. Click **Enable**

## 3. Set Firestore Rules

After creating the database, update the rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write their own designs
    match /designs/{designId} {
      allow read, write: if request.auth != null && 
                            request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

Click **Publish** to save the rules.

## 4. Create Storage Bucket (Optional - for cloud images)

1. Go to **Build** → **Storage**
2. Click **Get Started**
3. Use default security rules
4. Click **Done**

## 5. Test Your Integration

Your app is ready! When you reload the page:
- Click "Sign In" in the navbar
- Try Google Sign-In or create an account
- Generate a design
- It will auto-save to Firestore

Check Firebase Console → Firestore to see your saved designs!
