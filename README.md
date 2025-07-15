# Kidelytics: AI-Powered Story Generator for Kids

Kidelytics is an Angular-based web application that leverages the power of Google Cloud's Vertex AI to generate engaging and personalized stories for children. By answering a series of fun questions, parents and educators can create unique, illustrated stories tailored to a child's interests and learning goals, all orchestrated by the Genkit framework.

## Table of Contents

- [Kidelytics: AI-Powered Story Generator for Kids](#kidelytics-ai-powered-story-generator-for-kids)
  - [Table of Contents](#table-of-contents)
  - [Technologies Used](#technologies-used)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [1. Clone the Repository](#1-clone-the-repository)
    - [2. Install Dependencies](#2-install-dependencies)
    - [3. Set Up Google Cloud & Firebase](#3-set-up-google-cloud--firebase)
    - [4. Configure Environment Variables](#4-configure-environment-variables)
    - [5. Run the Application](#5-run-the-application)
  - [Project Structure](#project-structure)
  - [How It Works](#how-it-works)
  - [Contributing](#contributing)

## Technologies Used

- **Frontend:**

  - [Angular](https://angular.io/): A powerful framework for building dynamic single-page applications.
  - [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework for rapid UI development.
  - [Angular Material](https://material.angular.io/): A UI component library for Angular.

- **Backend & AI:**

  - [Node.js](https://nodejs.org/en) with [Express](https://expressjs.com/): For the server-side logic and API endpoints.
  - [**Google Cloud Vertex AI**](https://cloud.google.com/vertex-ai): The core platform for hosting and running generative AI models (like Gemini for text and Imagen for images).
  - [**Genkit**](https://firebase.google.com/docs/genkit): An open-source framework from Google for building, deploying, and monitoring AI-powered applications.
  - [**Firebase Firestore**](https://firebase.google.com/docs/firestore): A NoSQL database for storing the generated stories.

- **Development & Authentication:**
  - [Angular CLI](https://angular.io/cli): For managing the Angular project.
  - [TypeScript](https://www.typescriptlang.org/): For type-safe JavaScript development.
  - [**Google Cloud SDK (gcloud)**](https://cloud.google.com/sdk): For authenticating the local development environment with your Google Cloud project.

## Getting Started

Follow these steps to get a local copy of the project up and running on your machine.

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v20.x or higher)
- [Angular CLI](https://angular.io/cli)
- A [Google Cloud](https://cloud.google.com/) account with an active billing account.
- The [Google Cloud SDK (`gcloud` CLI)](https://cloud.google.com/sdk/docs/install) installed and configured on your machine.

### 1. Clone the Repository

````bash
git clone https://github.com/your-username/kidelytics.git
cd kidelytics```

### 2. Install Dependencies

Install the necessary npm packages for the project:

```bash
npm install
````

### 3. Set Up Google Cloud & Firebase

This project uses Google Cloud for AI services and Firebase for the database.

1.  **Create a Google Cloud Project:**

    - Go to the [Google Cloud Console](https://console.cloud.google.com/projectcreate) and create a new project.
    - Make a note of the **Project ID**.

2.  **Enable Required APIs:**

    - For your new project, you must enable the Vertex AI API.
    - Visit the [Vertex AI API Library page](https://console.cloud.google.com/apis/library/vertexai.googleapis.com) and click **Enable**.

3.  **Authenticate via `gcloud` CLI:**

    - This is a crucial step that allows Genkit to securely access your Google Cloud resources without needing to manage API keys in your code.
    - Run the following command in your terminal and follow the prompts to log in with your Google account:
      ```bash
      gcloud auth application-default login
      ```
    - Set your active project to the one you just created. This ensures all subsequent `gcloud` and SDK commands target the correct project.
      ````bash
      gcloud config set project YOUR_PROJECT_ID
      ```        (Replace `YOUR_PROJECT_ID` with the ID from step 1).
      ````

4.  **Set Up Firebase:**
    - Go to the [Firebase Console](https://console.firebase.google.com/) and click "**Add project**".
    - Select your existing Google Cloud Project to link Firebase to it.
    - From your project's dashboard, create a new **Web app** (the `</>` icon).
    - You will be provided with a `firebaseConfig` object. Copy these keys for the next step.
    - Navigate to the **Firestore Database** section and create a new database. Start in **test mode** for easy setup (you can configure security rules later).

### 4. Configure Environment Variables

Create a new file in the `src/environments/` directory named `environment.ts`. This file will hold your non-secret Firebase configuration.

**`src/environments/environment.ts`**:

```typescript
export const environment = {
  production: false,
  // Paste the firebaseConfig object from the Firebase console here
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID", // Should match your GCP Project ID
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID",
};
```

You do not need to add any Vertex AI or Gemini API keys here. Genkit will automatically use the credentials you set up with the `gcloud` CLI.

### 5. Run the Application

Now you can start the Angular development server and the backend Express server.

```bash
# In one terminal, run the Angular dev server
ng serve

# The Express server (defined in src/server.ts) will run as part of the Angular SSR setup
# and will be available on http://localhost:4000 (by default)
```

Open your browser and navigate to `http://localhost:4200/`. The app should be running and fully capable of communicating with your backend services.

## Project Structure

Here is an overview of the key files and directories in the project:

```
.
├── src/
│   ├── app/
│   │   ├── components/       # Reusable UI components
│   │   ├── services/         # Services for API calls (generate-story.ts)
│   │   ├── model/            # TypeScript types and interfaces
│   │   └── ...
│   ├── constants/          # Application constants (e.g., questions.ts)
│   ├── genkit/             # Genkit AI flow definitions (storyGenerationFlow.ts)
│   ├── environments/       # Environment configuration files
│   ├── server.ts           # Express server for handling API requests and Genkit flows
│   └── ...
├── angular.json            # Angular project configuration
├── package.json            # Project dependencies and scripts
└── ...
```

## How It Works

1.  **User Input**: The user answers a series of questions within the Angular app.
2.  **API Call**: The frontend sends these answers to the backend Express server.
3.  **Genkit Orchestration**: The server triggers a Genkit flow (`storyGenerationFlow`).
4.  **AI Story Generation**: This flow makes a call to a **Gemini model hosted on Vertex AI** to generate the story text and prompts for illustrations.
5.  **AI Image Generation**: For each story part, another Genkit flow calls an **image generation model (e.g., Imagen) on Vertex AI** to create a picture.
6.  **Storing the Story**: The complete story, including the text and image data, is saved to Firebase Firestore.
7.  **Displaying the Story**: The user is given a link to a page where they can view the newly generated story with its illustrations.

## Contributing

Contributions are welcome! If you have ideas for new features or improvements, please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
