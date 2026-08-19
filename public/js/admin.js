import { db, storage } from "./firebase.js";
import { collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// 1. Yangi Case Yaratish
export async function saveNewCase(caseData, imageFile) {
  try {
    let imageUrl = "";
    if (imageFile) {
      const storageRef = ref(storage, `cases/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const docRef = await addDoc(collection(db, "cases"), {
      ...caseData,
      imageUrl: imageUrl,
      createdAt: new Date()
    });

    alert("Jinoyat ishi saqlandi! ID: " + docRef.id);
  } catch (error) {
    console.error("Xatolik:", error);
  }
}

// 2. Barcha Case'larni Olish (admin/cases.html uchun)
export async function loadAdminCases() {
  const querySnapshot = await getDocs(collection(db, "cases"));
  const casesTable = document.getElementById("admin-cases-list");
  if (!casesTable) return;

  casesTable.innerHTML = "";
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    casesTable.innerHTML += `
      <tr>
        <td><b>${docSnap.id}</b></td>
        <td>${data.title}</td>
        <td>LVL ${data.level}</td>
        <td><button onclick="deleteCaseItem('${docSnap.id}')">O'chirish</button></td>
      </tr>
    `;
  });
}
