// Telegram init
function initTelegramUser() {
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe?.user;
    if (user) {
        document.querySelector('.profile-name').textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');
        document.querySelector('.profile-id').textContent = 'Telegram ID: @' + (user.username || user.id);
        document.querySelector('.avatar').textContent = user.first_name.charAt(0).toUpperCase();
    }
    tg.ready();
    tg.expand();
}
window.addEventListener('load', initTelegramUser);

// Sample data
let totalBalance = 5.75;
let selectedPlan = 'Free';
let planSpeed = 1;
let miningActive = false;
let miningTimerInterval = null;
let miningRemaining = 3 * 3600;
let adWatched = false;
let adTimerInterval = null;
let totalReferrals = 3;
let rewardEarned = 0.30;

function updateBalances() {
    document.getElementById('totalBalance').textContent = totalBalance.toFixed(2);
    document.getElementById('withdrawBalance').textContent = totalBalance.toFixed(2);
    document.getElementById('totalReferrals').textContent = totalReferrals;
    document.getElementById('rewardEarned').textContent = '$' + rewardEarned.toFixed(2);
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

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateMiningTimerDisplay() {
    document.getElementById('miningTimer').textContent = formatTime(miningRemaining);
}

function startMining() {
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
    miningTimerInterval = setInterval(() => {
        if (miningRemaining <= 0) {
            clearInterval(miningTimerInterval);
            miningActive = false;
            totalBalance += 0.05;
            updateBalances();
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

function selectPlan(planName, price, speedMultiplier) {
    if (planName === selectedPlan) {
        alert('This plan is already selected');
        return;
    }
    selectedPlan = planName;
    planSpeed = speedMultiplier;
    document.getElementById('currentPlan').textContent = planName;
    alert(`${planName} plan activated (Demo) - Speed ${speedMultiplier}x`);
    if (!miningActive) {
        miningRemaining = Math.floor(3 * 3600 / planSpeed);
        updateMiningTimerDisplay();
    } else {
        alert('Mining is active, next session will use new speed');
    }
}

function withdraw() {
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
    updateBalances();
    document.getElementById('usdtAddress').value = '';
    alert('✅ Withdrawal request successful! $25 will be sent.');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        alert('Logged out (Demo)');
    }
}

updateBalances();
document.getElementById('miningTimer').textContent = formatTime(miningRemaining);
adWatched = false;
