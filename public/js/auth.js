// js/auth.js
import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "cases.html";
  } catch (error) {
    alert("Kirishda xatolik: " + error.message);
  }
}
