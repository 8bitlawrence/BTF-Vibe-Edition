// --- Game State ---
const game = {
    coins: 100,
    farms: [],
    upgrades: [],
    yieldMultiplier: 1,
    sellMultiplier: 1,
    tickSpeed: 1000,
    autoCollect: false,
    instantSell: false,
    hideAlerts: false,
    ep: 0,
    username: null,
    inventory: []
};
// Ensure inventory is always initialized (for old saves)
if (!game.inventory) game.inventory = [];
// --- DOM Elements ---
const farmsList = document.getElementById('farms-list');
const upgradesList = document.getElementById('upgrades-list');
const coinsEl = document.getElementById('coins');
const produceEl = document.getElementById('produce');
const buyFarmBtn = document.getElementById('buy-farm');
const userInfo = document.getElementById('user-info');
const usernameLabel = document.getElementById('username-label');
const adminPanel = document.getElementById('admin-panel');
const adminCoinsBtn = document.getElementById('admin-coins-btn');
// --- Crop Rarities ---
const CROP_RARITIES = [
	{ name: 'Common', multiplier: 1, class: 'rarity-common' },
	{ name: 'Uncommon', multiplier: 1.5, class: 'rarity-uncommon' },
	{ name: 'Rare', multiplier: 2.5, class: 'rarity-rare' },
	{ name: 'Epic', multiplier: 4, class: 'rarity-epic' },
	{ name: 'Legendary', multiplier: 8, class: 'rarity-legendary' },
	{ name: 'Mythic', multiplier: 16, class: 'rarity-mythic' },
	{ name: 'Chromatic', multiplier: 32, class: 'rarity-chromatic' },
];

// --- Game Data ---
const FARM_TYPES = [
	{ name: 'Wheat Farm', baseCost: 50, baseYield: 1, emoji: '🌾', crops: [
		{ name: 'Wheat', yield: 1, emoji: '🌾', price: 1, rarity: 0 },
		{ name: 'Barley', yield: 1.2, emoji: '🌱', price: 1.5, rarity: 1 }
	] },
	{ name: 'Corn Farm', baseCost: 200, baseYield: 5, emoji: '🌽', crops: [
		{ name: 'Corn', yield: 5, emoji: '🌽', price: 2, rarity: 0 },
		{ name: 'Popcorn', yield: 6, emoji: '🍿', price: 3, rarity: 2 }
	] },
	{ name: 'Cow Farm', baseCost: 800, baseYield: 20, emoji: '🐄', crops: [
		{ name: 'Milk', yield: 20, emoji: '🥛', price: 4, rarity: 0 },
		{ name: 'Cheese', yield: 25, emoji: '🧀', price: 7, rarity: 3 }
	] },
	{ name: 'Apple Farm', baseCost: 2500, baseYield: 60, emoji: '🍎', crops: [
		{ name: 'Apple', yield: 60, emoji: '🍎', price: 3, rarity: 0 },
		{ name: 'Peach', yield: 70, emoji: '🍑', price: 4, rarity: 1 },
		{ name: 'Golden Apple', yield: 100, emoji: '🍏', price: 20, rarity: 6 }
	] },
	{ name: 'Grape Farm', baseCost: 8000, baseYield: 200, emoji: '🍇', crops: [
		{ name: 'Grape', yield: 200, emoji: '🍇', price: 5, rarity: 1 },
		{ name: 'Wine', yield: 300, emoji: '🍷', price: 12, rarity: 3 },
		{ name: 'Chromatic Berry', yield: 500, emoji: '🫐', price: 100, rarity: 6 }
	] },
	{ name: 'Bee Farm', baseCost: 20000, baseYield: 600, emoji: '🐝', crops: [
		{ name: 'Honey', yield: 600, emoji: '🍯', price: 8, rarity: 1 },
		{ name: 'Royal Jelly', yield: 900, emoji: '👑', price: 20, rarity: 6 }
	] },
	{ name: 'Rice Farm', baseCost: 60000, baseYield: 1800, emoji: '🍚', crops: [
		{ name: 'Rice', yield: 1800, emoji: '🍚', price: 4, rarity: 0 },
		{ name: 'Chromatic Rice', yield: 2500, emoji: '🍙', price: 15, rarity: 6 }
	] },
	{ name: 'Greenhouse', baseCost: 200000, baseYield: 6000, emoji: '🏡', crops: [
		{ name: 'Tomato', yield: 6000, emoji: '🍅', price: 6, rarity: 1 },
		{ name: 'Lettuce', yield: 7000, emoji: '🥬', price: 7, rarity: 1 },
		{ name: 'Chromatic Flower', yield: 10000, emoji: '🌸', price: 200, rarity: 6 }
	] },
	{ name: 'Truffle Farm', baseCost: 800000, baseYield: 20000, emoji: '🍄', crops: [
		{ name: 'Truffle', yield: 20000, emoji: '🍄', price: 30, rarity: 2 },
		{ name: 'Mushroom', yield: 25000, emoji: '🍄', price: 10, rarity: 0 }
	] },
    // Suspicious Tower: generates 1 Enchantment Point every 30 seconds
    { 
      name: 'Suspicious Tower', 
      baseCost: 2000000, 
      baseYield: 0, 
      emoji: '🗼', 
      maxLevel: 5, 
      crops: [
        { name: 'Suspicious Power', yield: 0, emoji: '🗼', price: 0, rarity: 5, unlockLevel: 5 }
      ] 
    },
    { name: 'Chroma Farm', baseCost: 3000000, baseYield: 70000, emoji: '✨', crops: [
        { name: 'Solar Power', yield: 70000, emoji: '🔋', price: 30, rarity: 6 },
        { name: 'Rizz', yield: 90000, emoji: '🌟', price: 30, rarity: 6 },
        { name: 'ULTIMATE RIZZ', yield: 120000, emoji: '✨', price: 50, rarity: 6 }
    ] },
];

// --- Rendering ---
function render() {
    // Debug: check DOM elements
    console.log('Rendering farms. farmsList:', farmsList, 'FARM_TYPES:', FARM_TYPES.length);
    // Admin panel visibility
    if (game.username === 'iamintheinnercircle911') {
        adminPanel.style.display = 'flex';
    } else {
        adminPanel.style.display = 'none';
    }
    coinsEl.textContent = `Coins: ${formatNum(game.coins)}`;
    produceEl.textContent = '';
    document.getElementById('ep').textContent = `Enchantment Points: ${game.ep}`;
    // Show current effect if any
    let effectBar = document.getElementById('effect-bar');
    if (!effectBar) {
        effectBar = document.createElement('div');
        effectBar.id = 'effect-bar';
        effectBar.style = 'margin: 0 0 12px 0; color: #7d4afc; font-weight: bold;';
        coinsEl.parentElement.insertBefore(effectBar, coinsEl.parentElement.firstChild);
    }
    if (window.currentEffect) {
        effectBar.innerHTML = `Potion of Enchanting active`;
        effectBar.style.display = '';
    } else {
        effectBar.innerHTML = '';
        effectBar.style.display = 'none';
    }

    // Farms
    farmsList.innerHTML = '';
    for (let i = 0; i < FARM_TYPES.length; i++) {
        const farmType = FARM_TYPES[i];
        const owned = getFarmCount(i);
        const cost = getFarmCost(i);
        const farm = getFarmObj(i);
        const level = farm ? getFarmLevel(i) : 1;
        const cropIdx = farm ? getFarmCrop(i) : 0;
        const crop = farmType.crops[cropIdx];
        const yieldPer = farm ? getFarmYield(i) : farmType.baseYield;
        const pricePer = farm ? getFarmSellPrice(i) : farmType.crops[0].price;
        // Add gold shimmer if Suspicious Tower is owned, chromatic shimmer for Chroma Farm, or gold for max level
        let shimmerClass = '';
        if (farm) {
            if (farmType.name === 'Suspicious Tower') {
                shimmerClass = 'rarity-legendary shimmer-gold';
            } else if (farmType.name === 'Chroma Farm') {
                shimmerClass = 'rarity-chromatic';
            } else if (farm.level === 15) {
                shimmerClass = 'rarity-chromatic';
            }
        }
        // Show MAX in gold if level 15 (use CSS class)
        let isMax = (farm && farm.level === 15);
        let levelDisplay = isMax ? '<span class="max-level">MAX</span>' : (farm ? level : 1);
        let headerLevel = isMax ? 'MAX' : (farm ? level : '');
        const div = document.createElement('div');
        div.className = 'farm-card ' + shimmerClass;
        div.id = `farm-card-${i}`;
        div.innerHTML = `
            <div class="farm-header">
                <span class="farm-emoji">${farmType.emoji}</span>
                <b class="farm-title">${farmType.name}</b>
                ${owned > 0 ? `<span style='margin-left:10px;font-size:0.95em;color:#7d4afc;'>[Owned: ${owned}${farm ? ", Lv. " + headerLevel : ""}]</span>` : ''}
            </div>
            <div class="farm-stats">
                <span>Owned: <b>${owned}</b></span>
                <span>Level: <b>${levelDisplay}</b></span>
                <span>Yield: <b>+${formatNum(yieldPer)}</b> /sec each</span>
                <span>Sell: <b>${formatNum(pricePer)}</b> coins per</span>
            </div>
            <div class="farm-actions">
                <button ${(game.coins < cost) ? 'disabled' : ''} onclick="buyFarm(${i})">Buy</button>
                ${(isMax) ? '' : `<button ${(owned === 0 || !farm || game.coins < getFarmUpgradeCost(i)) ? 'disabled' : ''} onclick="upgradeFarm(${i})">Upgrade</button>`}
            </div>
        `;
        div.onclick = () => showFarmModal(i);
        farmsList.appendChild(div);
        console.log(`Rendering farm card for type ${i}:`, farmType.name, 'owned:', owned, 'farm:', farm);
    }
    // Upgrades (removed, handled by enchantments)
    if (upgradesList) upgradesList.innerHTML = '';

    // Show user info if signed in
    if (game.username) {
        userInfo.style.display = 'flex';
        usernameLabel.textContent = game.username;
    } else {
        userInfo.style.display = 'none';
        usernameLabel.textContent = '';
    }
}

const ENCHANTMENT_TYPES = [
  { key: 'fertilizer', name: 'Fertilizer', desc: 'Increase yield by 20% per level', baseCost: 1, effect: (base, lvl) => base * (1 + 0.2 * lvl) },
  { key: 'tractor', name: 'Tractor', desc: 'Increase yield by 50% per level', baseCost: 2, effect: (base, lvl) => base * (1 + 0.5 * lvl) },
  { key: 'irrigation', name: 'Irrigation', desc: 'Farms produce 2x faster per level', baseCost: 3, effect: (base, lvl) => base / Math.pow(2, lvl) },
];

// Add enchantments and ep to game state if missing
if (!('ep' in game)) game.ep = 0;
function ensureFarmEnchantments(farm) {
  if (!farm.enchantments) {
    farm.enchantments = {};
    ENCHANTMENT_TYPES.forEach(e => farm.enchantments[e.key] = 0);
  }
}

// --- Game State ---
function getFarmYield(typeIdx) {
	const farm = getFarmObj(typeIdx);
	if (!farm) return 0;
	const cropIdx = farm.crop || 0;
	const crop = FARM_TYPES[typeIdx].crops[cropIdx];
	// Each level increases yield by 50%
	return crop.yield * farm.level * game.yieldMultiplier;
}

function getFarmSellPrice(typeIdx) {
	const farm = getFarmObj(typeIdx);
	if (!farm) return 0;
	const cropIdx = farm.crop || 0;
	const crop = FARM_TYPES[typeIdx].crops[cropIdx];
	return crop.price * game.sellMultiplier;
}

function getFarmCost(typeIdx) {
	const base = FARM_TYPES[typeIdx].baseCost;
	const owned = getFarmCount(typeIdx);
	return Math.floor(base * Math.pow(1.15, owned));
}

function getFarmUpgradeCost(typeIdx) {
    const farm = getFarmObj(typeIdx);
    if (!farm) return 0;
    // Upgrade cost increases exponentially: baseCost * 2^(level-1) * 1.15^owned
    const base = FARM_TYPES[typeIdx].baseCost;
    const owned = getFarmCount(typeIdx);
    return Math.floor(base * Math.pow(2, farm.level - 1) * Math.pow(1.15, owned));
}

// --- Utility Functions ---
function getFarmCount(typeIdx) {
    const farm = game.farms.find(f => f.type === typeIdx);
    return farm ? farm.count : 0;
}

function getFarmObj(typeIdx) {
    return game.farms.find(f => f.type === typeIdx);
}

function getFarmLevel(typeIdx) {
    const farm = getFarmObj(typeIdx);
    return farm ? farm.level : 1;
}

function getFarmCrop(typeIdx) {
    const farm = getFarmObj(typeIdx);
    return farm ? farm.crop : 0;
}

function formatNum(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num);
}

// --- Game Logic ---
function buyFarm(typeIdx) {
	const cost = getFarmCost(typeIdx);
	if (game.coins >= cost) {
		game.coins -= cost;
		let farm = getFarmObj(typeIdx);
		if (!farm) {
			farm = { type: typeIdx, count: 0, level: 1, crop: 0 };
			game.farms.push(farm);
		}
		farm.count++;
		animateFarm(typeIdx, 'buy');
		render();
	}
}

function upgradeFarm(typeIdx) {
    const farm = getFarmObj(typeIdx);
    if (!farm || farm.count === 0) return;
    const farmType = FARM_TYPES[typeIdx];
    const maxLevel = farmType.maxLevel || 15;
    if (farm.level >= maxLevel) return; // Max level cap
    const cost = getFarmUpgradeCost(typeIdx);
    if (game.coins >= cost) {
        game.coins -= cost;
        farm.level = Math.min((farm.level || 1) + 1, maxLevel);
        console.log(`Upgraded farm type ${typeIdx} to level ${farm.level}`);
        render();
        animateFarm(typeIdx, 'upgrade');
    }
}

function changeFarmCrop(typeIdx, cropIdx) {
    const farm = getFarmObj(typeIdx);
    if (!farm) return;
    const crop = FARM_TYPES[typeIdx].crops[cropIdx];
    // Only allow chromatic (rarity 6) if farm.level >= 15, others if level >= 10
    if ((crop.rarity === 6 && (!farm.level || farm.level < 15)) || (crop.rarity > 0 && crop.rarity < 6 && (!farm.level || farm.level < 10))) return;
    farm.crop = cropIdx;
    animateFarm(typeIdx, 'crop');
    render();
}

// --- Automated Selling ---
function autoSellFarms() {
    console.log('autoSellFarms called. Farms:', game.farms);
    let totalCoins = 0;
    let sales = [];
    for (const farm of game.farms) {
        const typeIdx = farm.type;
        const yieldPer = getFarmYield(typeIdx);
        const pricePer = getFarmSellPrice(typeIdx);
        const cropIdx = getFarmCrop(typeIdx);
        const crop = FARM_TYPES[typeIdx].crops[cropIdx || 0];
        if (yieldPer > 0 && pricePer > 0 && farm.count > 0) {
            const amount = yieldPer * farm.count;
            const profit = amount * pricePer;
            sales.push({ amount, crop: crop.name, emoji: crop.emoji, profit });
            totalCoins += profit;
        }
    }
    if (totalCoins > 0) {
        game.coins += totalCoins;
        console.log('Coins added:', totalCoins, 'Total coins:', game.coins);
        animateResource('coins');
        if (sales.length > 0) showSalePopup(sales);
    }
    render();
}

// Sale popup stacking logic
const popupStack = [];
function showSalePopup(sales) {
	const stack = document.getElementById('sale-popup-stack');
	if (!stack) return;
	// Create popup element
	let html = '';
	for (const sale of sales) {
		html += `<div>Sold <b>${formatNum(sale.amount)}</b> <span style=\"font-size:1.2em;\">${sale.emoji}</span> <b>${sale.crop}</b> for <b>${formatNum(sale.profit)}</b> coins</div>`;
	}
	const popup = document.createElement('div');
	popup.className = 'sale-popup show';
	popup.innerHTML = html;
	stack.appendChild(popup);
	popupStack.push(popup);
	// Only keep 2 popups visible
	while (popupStack.length > 2) {
		const old = popupStack.shift();
		if (old) {
			old.classList.remove('show');
			old.classList.add('hide');
			setTimeout(() => {
				if (old.parentElement) old.parentElement.removeChild(old);
			}, 350);
		}
	}
	setTimeout(() => {
		popup.classList.remove('show');
		popup.classList.add('hide');
		setTimeout(() => {
			if (popup.parentElement) popup.parentElement.removeChild(popup);
			const idx = popupStack.indexOf(popup);
			if (idx !== -1) popupStack.splice(idx, 1);
		}, 350);
	}, 1800);
}

function buyUpgrade(idx) {
	const upg = UPGRADE_TYPES[idx];
	if (game.coins >= upg.cost && !game.upgrades.includes(idx)) {
		game.coins -= upg.cost;
		game.upgrades.push(idx);
		upg.effect(game);
		render();
	}
}

// --- Modal Popup ---
let farmModal = null;
function showFarmModal(farmIdx) {
    const farmType = FARM_TYPES[farmIdx];
    const farm = getFarmObj(farmIdx);
    const owned = getFarmCount(farmIdx);
    const level = farm ? getFarmLevel(farmIdx) : 1;
    const cropIdx = farm ? getFarmCrop(farmIdx) : 0;
    const crop = farmType.crops[cropIdx];
    const yieldPer = farm ? getFarmYield(farmIdx) : farmType.baseYield;
    const pricePer = farm ? getFarmSellPrice(farmIdx) : farmType.crops[0].price;
    const upgradeCost = getFarmUpgradeCost(farmIdx);
    const descriptions = [
        'A basic wheat field. Can produce wheat or barley',
        'A corn farm for hearty produce.',
        'Raise cows for milk and cheese.',
        'Grow apples, peaches, and rare golden apples.',
        'A vineyard for grapes, wine, and rare berries.',
        'Bees make honey and royal jelly.',
        'Rice paddies for staple crops and sake.',
        'A greenhouse produces rare plants and flowers, including the Chromatic Flower. Has a byproduct of greenhouse gasses that can sometimes slow down your farms.',
        'Truffle farm for rare mushrooms.',
        'Solar farm for green energy.'
    ];
    const desc = descriptions[farmIdx] || '';
    // Show MAX in gold if level 15
    let levelDisplay = (farm && farm.level === 15) ? '<span style="color:gold;font-weight:bold;">MAX</span>' : (farm ? level : 1);
    let html = `<div class="farm-modal-bg" id="farm-modal-bg">
        <div class="farm-modal">
            <button class="modal-close" id="farm-modal-close">&times;</button>
            <div class="farm-modal-header">
                <span class="farm-emoji" style="font-size:2em;">${farmType.emoji}</span>
                <b class="farm-title">${farmType.name}</b>
            </div>
            <div class="farm-modal-desc">${desc}</div>
            <div class="farm-modal-stats">
                <span>Owned: <b>${owned}</b></span><br>
                <span>Level: <b>${levelDisplay}</b></span><br>
                <span>Current Crop: <span class="crop-emoji">${crop.emoji}</span> <b class="${CROP_RARITIES[crop.rarity||0].class}">${crop.name}</b> <span class="${CROP_RARITIES[crop.rarity||0].class}">[${CROP_RARITIES[crop.rarity||0].name}]</span></span><br>
                <span>Yield: <b>+${formatNum(yieldPer)}</b> /sec each</span><br>
                <span>Sell: <b>${formatNum(pricePer)}</b> coins per</span>
            </div>
            <div class="farm-modal-crops">
                <b>Choose Crop:</b><br>
                ${farmType.crops.map((c, idx) => {
                    const rarityClass = CROP_RARITIES[c.rarity||0].class;
                    const rarityName = CROP_RARITIES[c.rarity||0].name;
                    let locked = false;
                    let lockMsg = '';
                    if (c.rarity === 6) {
                        locked = (!farm || farm.level < 15);
                        if (locked) lockMsg = ' (Unlocks at 15)';
                    } else if (c.rarity > 0) {
                        locked = (!farm || farm.level < 10);
                        if (locked) lockMsg = ' (Unlocks at 10)';
                    }
                    if (typeof c.unlockLevel === 'number') {
                      locked = (!farm || farm.level < c.unlockLevel);
                      if (locked) lockMsg = ` (Unlocks at ${c.unlockLevel})`;
                    }
                    return `<button class='crop-btn ${rarityClass}' style='margin:2px 2px 6px 0;' ${(farm && farm.crop === idx) ? 'disabled' : (!farm ? 'disabled' : '')}${locked ? ' disabled title="Unlocks at Level ' + (c.rarity === 6 ? '15' : '10') + '"' : ''} onclick='${locked ? '' : `changeFarmCrop(${farmIdx},${idx});closeFarmModal()`}'>${c.emoji} ${c.name} <span class="${rarityClass}">[${rarityName}]</span>${locked ? ' <span style=\"color:#888;font-size:0.9em;\">' + lockMsg + '</span>' : ''}</button>`;
                }).join(' ')}
            </div>
            <div class="farm-modal-actions">
                <button ${(game.coins < getFarmCost(farmIdx)) ? 'disabled' : ''} onclick="buyFarm(${farmIdx});closeFarmModal()">Buy</button>
                ${(farm && farm.level === 15) ? '' : `<button ${(!farm || game.coins < upgradeCost) ? 'disabled' : ''} onclick="upgradeFarm(${farmIdx});closeFarmModal()">Upgrade (${formatNum(upgradeCost)})</button>`}
            </div>
        </div>
    </div>`;
    // Remove any existing modal
    if (farmModal && farmModal.parentElement) farmModal.parentElement.removeChild(farmModal);
    // Add to body
    const temp = document.createElement('div');
    temp.innerHTML = html;
    farmModal = temp.firstChild;
    document.body.appendChild(farmModal);
    // Close logic
    document.getElementById('farm-modal-close').onclick = closeFarmModal;
    document.getElementById('farm-modal-bg').onclick = function(e) {
        if (e.target === this) closeFarmModal();
    };
}
window.closeFarmModal = function() {
    if (farmModal && farmModal.parentElement) farmModal.parentElement.removeChild(farmModal);
    farmModal = null;
}

// --- Tab Switching Logic ---
const farmsSection = document.getElementById('farms-section');
const shopSection = document.getElementById('shop-section');
const enchantmentsSection = document.getElementById('enchantments-section');
const settingsSection = document.getElementById('settings-section');
const inventorySection = document.getElementById('inventory-section');
const tabFarms = document.getElementById('tab-farms');
const tabShop = document.getElementById('tab-shop');
const tabInventory = document.getElementById('tab-inventory');
const tabEnchantments = document.getElementById('tab-enchantments');
const tabSettings = document.getElementById('tab-settings');

function showFarmsTab() {
    farmsSection.style.display = '';
    shopSection.style.display = 'none';
    enchantmentsSection.style.display = 'none';
    settingsSection.style.display = 'none';
    tabFarms.classList.add('active');
    tabShop.classList.remove('active');
    tabEnchantments.classList.remove('active');
    tabSettings.classList.remove('active');
}

function showShopTab() {
    farmsSection.style.display = 'none';
    shopSection.style.display = '';
    enchantmentsSection.style.display = 'none';
    settingsSection.style.display = 'none';
    tabInventory.classList.remove('active');
    tabEnchantments.classList.remove('active');
    tabSettings.classList.remove('active');
    tabFarms.classList.remove('active');
    tabShop.classList.add('active');
    tabEnchantments.classList.remove('active');
    tabSettings.classList.remove('active');
    renderShopUI();
}
function showEnchantmentsTab() {
    farmsSection.style.display = 'none';
    enchantmentsSection.style.display = '';
    settingsSection.style.display = 'none';
    tabFarms.classList.remove('active');
    tabEnchantments.classList.add('active');
    tabSettings.classList.remove('active');
    renderEnchantmentsUI();
}
function showInventoryTab() {
    farmsSection.style.display = 'none';
    shopSection.style.display = 'none';
    inventorySection.style.display = '';
    enchantmentsSection.style.display = 'none';
    settingsSection.style.display = 'none';
    tabFarms.classList.remove('active');
    tabShop.classList.remove('active');
    tabInventory.classList.add('active');
    tabEnchantments.classList.remove('active');
    tabSettings.classList.remove('active');
    renderInventoryUI();
}
function showSettingsTab() {
    farmsSection.style.display = 'none';
    enchantmentsSection.style.display = 'none';
tabInventory.onclick = showInventoryTab;
    settingsSection.style.display = '';
    tabFarms.classList.remove('active');
    tabEnchantments.classList.remove('active');
    tabSettings.classList.add('active');
    renderSettingsUI();
}
tabFarms.onclick = showFarmsTab;
tabShop.onclick = showShopTab;
tabEnchantments.onclick = showEnchantmentsTab;
tabSettings.onclick = showSettingsTab;
// --- Shop/Inventory/Effect State ---
let enchantingPotionActive = false;
let enchantingPotionTimeout = null;
let currentEffect = null;
window.currentEffect = null;

// Inventory UI
window.renderInventoryUI = function renderInventoryUI() {
    const el = document.getElementById('inventory-ui');
    if (!game.inventory || game.inventory.length === 0) {
        el.innerHTML = '<div style="color:#888;padding:24px 0;">You have no items in your inventory.</div>';
        return;
    }
    let selectedIdx = typeof game.selectedInventoryIdx === 'number' ? game.selectedInventoryIdx : -1;
    let itemsHtml = game.inventory.map((item, idx) => `
        <div class='inventory-item' style='display:flex;align-items:center;gap:12px;padding:10px 0;${selectedIdx===idx?'background:#e6e6ff;border-radius:8px;':''}' onclick='window.selectInventoryItem(${idx})'>
            <span style='font-size:1.7em;'>${item.icon}</span>
            <div style='flex:1;'>
                <b>${item.name}</b><br><span style='color:#888;font-size:0.95em;'>${item.desc}</span>
            </div>
        </div>
    `).join('');
    let useBtn = '';
    if (selectedIdx >= 0 && game.inventory[selectedIdx]) {
        // Always show Use button for any selected item
        useBtn = `<button id='use-inventory-item' style='margin-top:10px;'>Use Selected Item</button>`;
    }
    el.innerHTML = itemsHtml + useBtn;
    if (useBtn) {
        document.getElementById('use-inventory-item').onclick = function() {
            window.useInventoryItem(selectedIdx);
        };
    }
}

window.selectInventoryItem = function(idx) {
    game.selectedInventoryIdx = idx;
    window.renderInventoryUI();
};

window.useInventoryItem = function(idx) {
    const item = game.inventory[idx];
    if (!item) return;
    if (item.effect === 'enchant_x10') {
        window.activateEnchantPotion(item.duration);
    }
    // Remove from inventory
    game.inventory.splice(idx, 1);
    game.selectedInventoryIdx = -1;
    window.renderInventoryUI();
    render();
};

window.activateEnchantPotion = function(duration) {
    enchantingPotionActive = true;
    currentEffect = { name: 'Potion of Enchanting', desc: 'x10 chance of getting Enchantment Points', icon: '🧪' };
    window.currentEffect = currentEffect;
    if (enchantingPotionTimeout) clearTimeout(enchantingPotionTimeout);
    enchantingPotionTimeout = setTimeout(() => {
        enchantingPotionActive = false;
        currentEffect = null;
        window.currentEffect = null;
        window.renderInventoryUI();
        renderShopUI();
        render();
    }, duration);
    window.renderInventoryUI();
    renderShopUI();
    render();
};

function renderShopUI() {
    const el = document.getElementById('shop-ui');
    el.innerHTML = `
        <div class='shop-card' style='background:#f8f8f8;border-radius:8px;padding:16px 20px;margin-bottom:18px;box-shadow:0 2px 8px #0001;'>
            <span style='font-size:2em;'>🧪</span>
            <b style='font-size:1.1em;margin-left:8px;'>Potion of Enchanting</b>
            <div style='margin:6px 0 10px 0;color:#888;'>x10 chance of getting Enchantment Points for 5 minutes</div>
            <button id='buy-enchant-potion' ${(game.coins < 100000) ? 'disabled' : ''}>Buy for 100,000 coins</button>
        </div>
    `;
    const btn = document.getElementById('buy-enchant-potion');
    if (btn) {
        btn.onclick = function() {
            if (game.coins >= 100000) {
                game.coins -= 100000;
                if (!game.inventory) game.inventory = [];
                game.inventory.push({ id: 'enchant_potion', name: 'Potion of Enchanting', desc: 'x10 chance of getting Enchantment Points for 5 minutes', icon: '🧪', effect: 'enchant_x10', duration: 5 * 60 * 1000 });
                renderInventoryUI();
                renderShopUI();
                render();
            }
        };
    }
}

// --- Settings UI ---
function renderSettingsUI() {
    const el = document.getElementById('settings-ui');
    el.innerHTML = `
        <div style='margin-bottom:18px;'>
            <label><input type='checkbox' id='toggle-alerts' ${game.hideAlerts ? 'checked' : ''}/> Hide crop sale alerts</label>
        </div>
        <div style='margin-bottom:18px;'>
            <b>Account</b><br>
            <input id='account-name' placeholder='Account name' style='margin:6px 0;padding:4px 8px;'/>
            <button id='btn-signin'>Sign In</button>
            <button id='btn-create'>Create Account</button>
            <button id='btn-save'>Save Progress</button>
            <button id='btn-load'>Load Progress</button>
            <div id='account-status' style='margin-top:8px;color:#7d4afc;'></div>
        </div>
    `;
    document.getElementById('toggle-alerts').onchange = function() {
        game.hideAlerts = this.checked;
        localStorage.setItem('btf_hideAlerts', game.hideAlerts ? '1' : '0');
    };
    document.getElementById('btn-signin').onclick = function() {
        const name = document.getElementById('account-name').value.trim();
        if (!name) return setStatus('Enter a name.');
        if (!localStorage.getItem('btf_save_' + name)) return setStatus('No account found.');
        loadProgress(name);
        game.username = name;
        render();
        setStatus('Signed in as ' + name);
    };
    document.getElementById('btn-create').onclick = function() {
        const name = document.getElementById('account-name').value.trim();
        if (!name) return setStatus('Enter a name.');
        saveProgress(name);
        game.username = name;
        render();
        setStatus('Account created and signed in as ' + name);
    };
    document.getElementById('btn-save').onclick = function() {
        const name = document.getElementById('account-name').value.trim();
        if (!name) return setStatus('Enter a name.');
        saveProgress(name);
        setStatus('Progress saved for ' + name);
    };
    document.getElementById('btn-load').onclick = function() {
        const name = document.getElementById('account-name').value.trim();
        if (!name) return setStatus('Enter a name.');
        loadProgress(name);
        game.username = name;
        render();
        setStatus('Progress loaded for ' + name);
    };
    function setStatus(msg) {
        document.getElementById('account-status').textContent = msg;
    }
}
function saveProgress(name) {
    localStorage.setItem('btf_save_' + name, JSON.stringify(game));
}
function loadProgress(name) {
    const data = localStorage.getItem('btf_save_' + name);
    if (data) {
        const obj = JSON.parse(data);
        Object.assign(game, obj);
        render();
    }
}
// --- Load hideAlerts setting on startup ---
game.hideAlerts = localStorage.getItem('btf_hideAlerts') === '1';
// --- Patch showSalePopup to respect hideAlerts ---
const origShowSalePopup = showSalePopup;
showSalePopup = function(sales) {
    if (game.hideAlerts) return;
    origShowSalePopup(sales);
}

// --- Enchantments UI Placeholder ---
function renderEnchantmentsUI() {
    const el = document.getElementById('enchantments-ui');
    if (!game.farms.length) {
        el.innerHTML = '<div style="color:#888;padding:24px 0;">You have no farms yet. Buy a farm to enchant it!</div>';
        return;
    }
    // Farm selector
    let farmOptions = game.farms.map((f, i) => `<option value="${i}">${FARM_TYPES[f.type].name} (Owned: ${f.count})</option>`).join('');
    let selectedIdx = (typeof game.selectedEnchantFarm === 'number' && game.farms[game.selectedEnchantFarm]) ? game.selectedEnchantFarm : 0;
    game.selectedEnchantFarm = selectedIdx;
    const farm = game.farms[selectedIdx];
    ensureFarmEnchantments(farm);
    // Enchantments UI
    let enchRows = ENCHANTMENT_TYPES.map(e => {
      const lvl = farm.enchantments[e.key] || 0;
      const cost = e.baseCost * (lvl + 1);
      return `<div class='enchant-row'><b>${e.name}</b> <span style='color:#888;'>Lv.${lvl}</span> <span style='font-size:0.95em;'>${e.desc}</span>
        <button class='enchant-btn' ${(game.ep < cost) ? 'disabled' : ''} onclick='upgradeEnchantment(${selectedIdx},"${e.key}",${cost})'>Upgrade (${cost} EP)</button></div>`;
    }).join('');
    el.innerHTML = `
      <div style='margin-bottom:12px;'>
        <label><b>Select Farm:</b> <select id='enchant-farm-select'>${farmOptions}</select></label>
      </div>
      <div style='margin-bottom:12px;'>
        <b>Enchantment Points:</b> <span style='color:#7d4afc;font-weight:bold;'>${game.ep}</span>
      </div>
      <div>${enchRows}</div>
    `;
    document.getElementById('enchant-farm-select').onchange = function() {
      game.selectedEnchantFarm = parseInt(this.value);
      renderEnchantmentsUI();
    };
}
window.upgradeEnchantment = function(farmIdx, key, cost) {
  const farm = game.farms[farmIdx];
  ensureFarmEnchantments(farm);
  if (game.ep >= cost) {
    game.ep -= cost;
    farm.enchantments[key]++;
    animateFarm(farm.type, 'enchant');
    renderEnchantmentsUI();
    render();
  }
};

// --- Animate resource (coins) ---
function animateResource(resource) {
    // Dummy: add animation here if desired
}
// --- Animate farm graphics on enchant/upgrade ---
function animateFarm(typeIdx, action) {
    var card = document.getElementById('farm-card-' + typeIdx);
    if (!card) return;
    const visual = card.querySelector('.farm-graphic');
    card.classList.remove('anim-bounce', 'anim-upgrade', 'anim-crop', 'anim-enchant');
    if (action === 'buy') {
        card.classList.add('anim-bounce');
    } else if (action === 'upgrade') {
        card.classList.add('anim-upgrade');
    } else if (action === 'crop') {
        card.classList.add('anim-crop');
    } else if (action === 'enchant') {
        card.classList.add('anim-enchant');
    }
    setTimeout(() => {
        card.classList.remove('anim-bounce', 'anim-upgrade', 'anim-crop', 'anim-enchant');
    }, 1000);
}

// --- Ensure initial render on page load ---
window.onload = function() {
    render();
    renderShopUI();
    // Restore admin coins button functionality
    if (adminCoinsBtn) {
        adminCoinsBtn.onclick = function() {
            game.coins += 10000000;
            render();
        };
    }
    // Start Suspicious Tower timer
    if (!window.suspiciousTowerInterval) {
        window.suspiciousTowerInterval = setInterval(() => {
            let total = 0;
            for (let i = 0; i < game.farms.length; i++) {
                const farm = game.farms[i];
                if (FARM_TYPES[farm.type].name === 'Suspicious Tower') {
                    total += farm.count || 1;
                }
            }
            if (total > 0) {
                game.ep += total;
                document.getElementById('ep').textContent = `Enchantment Points: ${game.ep}`;
            }
        }, 30000);
    }
};

// --- Prompt to save progress before leaving if signed in ---
window.addEventListener('beforeunload', function (e) {
    if (game.username) {
        // Show a confirmation dialog
        const confirmationMessage = 'You are signed in. Did you save your progress? Make sure to save before leaving!';
        (e || window.event).returnValue = confirmationMessage;
        return confirmationMessage;
    }
});
