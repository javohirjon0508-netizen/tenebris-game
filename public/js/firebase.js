import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
   apiKey: "AIzaSyALWGXz15GQslY6fJI8noiLbXKH-yCB1gI",
        authDomain: "web-ilova.firebaseapp.com",
        projectId: "web-ilova",
        storageBucket: "web-ilova.firebasestorage.app",
        messagingSenderId: "222468122005",
        appId: "1:222468122005:web:7443bbd80aaf95634d829c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
