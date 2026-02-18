const ENCHANTMENTS_DATA = {
    // Armures
    "Protection": 4,
    "Protection contre le feu (Fire Protection)": 4,
    "Protection contre les projectiles (Projectile Protection)": 4,
    "Protection contre les explosions (Blast Protection)": 4,
    "Épines (Thorns)": 3,
    "Apnée (Respiration)": 3,
    "Affinité aquatique (Aqua Affinity)": 1,
    "Chute amortie (Feather Falling)": 4,
    "Semelles givrantes (Frost Walker)": 2,
    "Agilité aquatique (Depth Strider)": 3,
    "Agilité des âmes (Soul Speed)": 3,
    "Faufilage rapide (Swift Sneak)": 3,

    // Épée & Hache
    "Tranchant (Sharpness)": 5,
    "Châtiment (Smite)": 5,
    "Fléau des arthropodes (Bane of Arthropods)": 5,
    "Recul (Knockback)": 2,
    "Aura de feu (Fire Aspect)": 2,
    "Butin (Looting)": 3,
    "Tranchant de zone (Sweeping Edge)": 3,

    // Outils (Pioche/Pelle/Hache/Houe)
    "Efficacité (Efficiency)": 5,
    "Fortune": 3,
    "Soyeux (Silk Touch)": 1,

    // Arc & Arbalète
    "Puissance (Power)": 5,
    "Frappe (Punch)": 2,
    "Flamme (Flame)": 1,
    "Infinité (Infinity)": 1,
    "Tir multiple (Multishot)": 1,
    "Perforation (Piercing)": 4,
    "Charge rapide (Quick Charge)": 3,

    // Trident & Canne à pêche
    "Loyauté (Loyalty)": 3,
    "Impulsion (Riptide)": 3,
    "Canalisation (Channeling)": 1,
    "Empalement (Impaling)": 5,
    "Chance de la mer (Luck of the Sea)": 3,
    "Appât (Lure)": 3,

    // Universel / Trésors
    "Solidité (Unbreaking)": 3,
    "Rapiéçage (Mending)": 1,
    "Malédiction du lien (Curse of Binding)": 1,
    "Malédiction de disparition (Curse of Vanishing)": 1
};

// Fonction pour remplir le menu trié par ordre alphabétique
window.onload = () => {
    const select = document.getElementById('enchantment-select');
    const sortedNames = Object.keys(ENCHANTMENTS_DATA).sort();
    
    select.innerHTML = "";
    sortedNames.forEach(name => {
        let opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });
};

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

    let tempBooks = [...books];
    let steps = [];

    // On regroupe par type d'abord
    const types = [...new Set(tempBooks.map(b => b.type))];
    
    types.forEach(currentType => {
        let typeBooks = tempBooks.filter(b => b.type === currentType);
        typeBooks.sort((a, b) => a.level - b.level);

        while (typeBooks.length > 1) {
            let b1 = typeBooks.shift();
            let b2 = typeBooks.shift();
            
            let maxLevel = ENCHANTMENTS_DATA[currentType];
            let newLevel;

            if (b1.level === b2.level) {
                newLevel = Math.min(b1.level + 1, maxLevel);
                if (b1.level === maxLevel) {
                    steps.push(`⚠️ ${currentType} est déjà au niveau max (${maxLevel}) !`);
                }
            } else {
                newLevel = Math.max(b1.level, b2.level);
            }

            steps.push(`✨ Fusion : ${currentType} ${b1.level} + ${b2.level} ➔ ${currentType} ${newLevel}`);
            typeBooks.push({ type: currentType, level: newLevel });
            typeBooks.sort((a, b) => a.level - b.level);
        }
    });

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
