// Firebase configuration - apni config values paste karo
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase initialize
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global variables
let currentUser = null;
let telegramUser = null;
let totalBalance = 0;
let selectedPlan = 'Free';
let planSpeed = 1;
let miningActive = false;
let miningTimerInterval = null;
let miningRemaining = 3 * 3600;
let adWatched = false;
let adTimerInterval = null;
let totalReferrals = 0;
let rewardEarned = 0;

// Telegram user init
function initTelegramUser() {
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe?.user;
    telegramUser = user || null;
    
    if (telegramUser) {
        document.querySelector('.profile-name').textContent = telegramUser.first_name + (telegramUser.last_name ? ' ' + telegramUser.last_name : '');
        document.querySelector('.profile-id').textContent = 'Telegram ID: @' + (telegramUser.username || telegramUser.id);
        document.querySelector('.avatar').textContent = telegramUser.first_name.charAt(0).toUpperCase();
    }
    tg.ready();
    tg.expand();
    
    loadUserData();
}

async function loadUserData() {
    if (!telegramUser) {
        telegramUser = { id: 'demo_user', first_name: 'Demo', last_name: 'User', username: 'demo' };
        document.querySelector('.profile-name').textContent = 'Demo User';
        document.querySelector('.profile-id').textContent = 'Telegram ID: @demo';
        document.querySelector('.avatar').textContent = 'D';
    }
    
    const userId = telegramUser.id.toString();
    const userRef = db.collection('users').doc(userId);
    
    try {
        const doc = await userRef.get();
        if (doc.exists) {
            const data = doc.data();
            totalBalance = data.balance || 0;
            selectedPlan = data.plan || 'Free';
            planSpeed = data.planSpeed || 1;
            totalReferrals = data.totalReferrals || 0;
            rewardEarned = data.rewardEarned || 0;
        } else {
            await userRef.set({
                name: telegramUser.first_name + ' ' + (telegramUser.last_name || ''),
                username: telegramUser.username || '',
                balance: 0,
                plan: 'Free',
                planSpeed: 1,
                totalReferrals: 0,
                rewardEarned: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            totalBalance = 0;
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
    
    updateUI();
}

function updateUI() {
    document.getElementById('totalBalance').textContent = totalBalance.toFixed(2);
    document.getElementById('withdrawBalance').textContent = totalBalance.toFixed(2);
    document.getElementById('totalReferrals').textContent = totalReferrals;
    document.getElementById('rewardEarned').textContent = '$' + rewardEarned.toFixed(2);
    document.getElementById('currentPlan').textContent = selectedPlan;
    document.getElementById('miningTimer').textContent = formatTime(miningRemaining);
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function switchSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-section="${sectionId}"]`).classList.add('active');
    document.querySelector('.page-container').scrollTop = 0;
}

function copyReferLink() {
    const link = document.getElementById('referLink').textContent;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => alert('Link copied!'));
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied!');
    }
}

async function startMining() {
    if (miningActive) {
        alert('Mining is already running!');
        return;
    }
    if (!adWatched) {
        showAdModal();
        return;
    }
    
    miningActive = true;
    miningRemaining = Math.floor(3 * 3600 / planSpeed);
    document.getElementById('startMiningBtn').textContent = '⏳ Mining in progress...';
    document.getElementById('startMiningBtn').disabled = true;
    updateMiningTimerDisplay();
    
    const userId = telegramUser.id.toString();
    const sessionRef = db.collection('mining_sessions').doc(userId);
    await sessionRef.set({
        startTime: firebase.firestore.FieldValue.serverTimestamp(),
        plan: selectedPlan,
        speed: planSpeed,
        reward: 0.05,
        status: 'active',
        userId: userId
    });
    
    miningTimerInterval = setInterval(() => {
        if (miningRemaining <= 0) {
            clearInterval(miningTimerInterval);
            miningActive = false;
            totalBalance += 0.05;
            updateBalanceInFirestore();
            sessionRef.update({ status: 'completed', endTime: firebase.firestore.FieldValue.serverTimestamp() });
            document.getElementById('startMiningBtn').textContent = 'Start Mining';
            document.getElementById('startMiningBtn').disabled = false;
            document.getElementById('miningTimer').textContent = '03:00:00';
            alert('✅ Mining complete! You earned $0.05.');
            adWatched = false;
        } else {
            miningRemaining--;
            updateMiningTimerDisplay();
        }
    }, 1000);
}

async function updateBalanceInFirestore() {
    if (!telegramUser) return;
    const userId = telegramUser.id.toString();
    await db.collection('users').doc(userId).update({
        balance: totalBalance,
        plan: selectedPlan,
        planSpeed: planSpeed,
        totalReferrals: totalReferrals,
        rewardEarned: rewardEarned
    });
}

function showAdModal() {
    const modal = document.getElementById('adModal');
    modal.classList.add('active');
    let adTime = 5;
    document.getElementById('adTimer').textContent = adTime;
    document.getElementById('adSkipBtn').disabled = true;
    document.getElementById('adSkipBtn').textContent = 'Please wait...';
    clearInterval(adTimerInterval);
    adTimerInterval = setInterval(() => {
        adTime--;
        document.getElementById('adTimer').textContent = adTime;
        if (adTime <= 0) {
            clearInterval(adTimerInterval);
            document.getElementById('adSkipBtn').disabled = false;
            document.getElementById('adSkipBtn').textContent = 'Close Ad';
        }
    }, 1000);
}

function skipAd() {
    clearInterval(adTimerInterval);
    document.getElementById('adModal').classList.remove('active');
    adWatched = true;
    if (!miningActive) {
        startMining();
    }
}

async function selectPlan(planName, price, speedMultiplier) {
    if (planName === selectedPlan) {
        alert('This plan is already selected');
        return;
    }
    selectedPlan = planName;
    planSpeed = speedMultiplier;
    document.getElementById('currentPlan').textContent = planName;
    await updateBalanceInFirestore();
    alert(`${planName} plan activated - Speed ${speedMultiplier}x`);
    if (!miningActive) {
        miningRemaining = Math.floor(3 * 3600 / planSpeed);
        updateMiningTimerDisplay();
    }
}

async function withdraw() {
    const address = document.getElementById('usdtAddress').value.trim();
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    if (!address) {
        alert('Please enter USDT address');
        return;
    }
    if (isNaN(amount) || amount !== 25) {
        alert('Withdrawal amount must be $25 only');
        return;
    }
    if (totalBalance < 25) {
        alert('Your balance is less than $25');
        return;
    }
    totalBalance -= 25;
    await updateBalanceInFirestore();
    
    const userId = telegramUser.id.toString();
    await db.collection('withdrawals').add({
        userId: userId,
        address: address,
        amount: 25,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('usdtAddress').value = '';
    alert('✅ Withdrawal request submitted!');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        alert('Logged out (Demo)');
    }
}

function updateMiningTimerDisplay() {
    document.getElementById('miningTimer').textContent = formatTime(miningRemaining);
}

window.addEventListener('load', initTelegramUser);
