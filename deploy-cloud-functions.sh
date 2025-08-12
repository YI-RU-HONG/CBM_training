#!/bin/bash

echo "🚀 Starting Cloud Functions deployment..."

# check if in the correct directory
if [ ! -f "functions/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# enter functions directory
cd functions

echo "📦 Installing dependencies..."
npm install

# check if installation is successful
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# go back to the root directory
cd ..

echo "🔥 Deploying Cloud Functions..."
firebase deploy --only functions

# check if deployment is successful
if [ $? -eq 0 ]; then
    echo "✅ Cloud Functions deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set GEMINI_API_KEY environment variable in Firebase Console"
    echo "2. Test the functions using the test page in the app"
    echo "3. Check Firebase Console for function logs"
else
    echo "❌ Error: Failed to deploy Cloud Functions"
    exit 1
fi 