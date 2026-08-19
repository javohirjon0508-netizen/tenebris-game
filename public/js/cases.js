import { db } from "./firebase.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Barcha case'lar ro'yxati (cases.html uchun)
export async function renderCasesList() {
  const container = document.getElementById("cases-grid");
  if (!container) return;

  const querySnapshot = await getDocs(collection(db, "cases"));
  container.innerHTML = "";

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    container.innerHTML += `
      <div class="case-card">
        <h3>${data.title}</h3>
        <p>Talab qilinadigan daraja: LVL ${data.level}</p>
        <a href="case.html?id=${docSnap.id}" class="btn">Ishni Ochish</a>
      </div>
    `;
  });
}

// Bitta case tafsilotlarini chiqarish (case.html uchun)
export async function renderSingleCase() {
  const container = document.getElementById("case-detail-container");
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('id');

  if (!caseId) return;

  const docRef = doc(db, "cases", caseId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const c = docSnap.data();
    container.innerHTML = `
      <div class="case-header">
        <h1>${c.title}</h1>
        <span>Level: ${c.level}</span>
      </div>

      ${c.imageUrl ? `<img src="${c.imageUrl}" class="case-banner" alt="Banner">` : ""}

      <div class="case-section">
        <h3>Voqea Bayoni</h3>
        <p>${c.desc}</p>
      </div>

      ${c.suspects && c.suspects.length ? `
        <div class="case-section">
          <h3>Gumondorlar</h3>
          <ul>
            ${c.suspects.map(s => `<li><b>${s.name}</b>: ${s.alibi}</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      ${c.timeline && c.timeline.length ? `
        <div class="case-section">
          <h3>Vaqt Xronologiyasi</h3>
          <ul>
            ${c.timeline.map(t => `<li>${t}</li>`).join("")}
          </ul>
        </div>
      ` : ""}
    `;
  }
}
