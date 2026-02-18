let books = [];

function addEnchantment() {
    const type = document.getElementById('enchantment-select').value;
    const level = parseInt(document.getElementById('level-input').value);
    
    books.push({ type, level });
    updateList();
}

function updateList() {
    const list = document.getElementById('enchantment-list');
    list.innerHTML = '';
    books.forEach((book, index) => {
        list.innerHTML += `<div class="enchant-item">
            ${book.type} niveau ${book.level}
            <button onclick="remove(${index})">X</button>
        </div>`;
    });
}

function optimize() {
    if (books.length < 2) return alert("Ajoute au moins 2 livres !");

    // Copie des livres pour ne pas modifier la liste originale
    let tempBooks = [...books];
    let steps = [];

    // Logique simplifiée : on fusionne les plus petits niveaux en priorité
    tempBooks.sort((a, b) => a.level - b.level);

    while (tempBooks.length > 1) {
        let b1 = tempBooks.shift();
        let b2 = tempBooks.shift();

        let newLevel;
        if (b1.type === b2.type) {
            // Règle Minecraft : si niveaux égaux, +1. Sinon, on garde le max.
            newLevel = (b1.level === b2.level) ? b1.level + 1 : Math.max(b1.level, b2.level);
        } else {
            // Si types différents, on garde les deux (ici on simplifie pour le même type)
            newLevel = Math.max(b1.level, b2.level);
        }

        let result = { type: b1.type, level: newLevel };
        steps.push(`Fusionner ${b1.type} ${b1.level} + ${b2.level} -> Niveau ${newLevel}`);
        tempBooks.push(result);
        tempBooks.sort((a, b) => a.level - b.level);
    }

    displayResults(steps);
}

function displayResults(steps) {
    const area = document.getElementById('tree-display');
    area.innerHTML = "<ul>" + steps.map(s => `<li>${s}</li>`).join('') + "</ul>";
}

function remove(index) {
    books.splice(index, 1);
    updateList();
}
