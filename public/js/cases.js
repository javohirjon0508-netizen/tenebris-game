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
const socket = typeof io !== 'undefined' ? io() : null;

if (socket) {
  socket.on('cases-updated', (casesList) => {
    const grid = document.getElementById('cases-grid');
    if (!grid) return;

    grid.innerHTML = '';
    casesList.forEach(c => {
      grid.innerHTML += `
        <div class="case-card" style="border: 1px solid #00f0ff; background: #090e17; padding: 15px; margin: 10px; border-radius: 8px;">
          <h3 style="color: #fff;">${c.title}</h3>
          <p style="color: #00f0ff;">Talab darajasi: LVL ${c.level}</p>
          <p style="color: #8a99ad;">${c.desc}</p>
          <a href="case.html?id=${c.id}" style="display: inline-block; padding: 8px 15px; background: #00f0ff; color: #000; text-decoration: none; font-weight: bold; border-radius: 4px;">ISHNI OCHISH</a>
        </div>
      `;
    });
  });
)s
