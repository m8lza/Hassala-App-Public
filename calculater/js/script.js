// بيانات المشروع
const ILS_TO_USD_RATE = 0.273;
let TARGET_AMOUNT_ILS = 2100; 
const INITIAL_BALANCE_ILS = 610;
const WEEKLY_DEPOSIT_AMOUNT = 10; 

// 💸 بيانات وإعدادات الفئات النقدية 💸
const DENOMINATIONS = [200, 100, 50, 20, 10, 5, 1, 0.5]; // فئات الشيكل
let cashDenominations = {}; // لتخزين عدد الأوراق: {200: 0, 100: 0, ...} 

// 🆕 مصفوفة الأيقونات للأوراق النقدية (لواجهة متطورة) 🆕
const DENOMINATION_ICONS = {
    200: '<i class="fas fa-money-bill-wave" style="color:#00bcd4;"></i>', // أزرق/سماوي
    100: '<i class="fas fa-money-bill-wave" style="color:#4CAF50;"></i>', // أخضر
    50: '<i class="fas fa-money-bill-wave" style="color:#ff9800;"></i>', // برتقالي
    20: '<i class="fas fa-money-bill-wave" style="color:#E91E63;"></i>', // وردي/أحمر
    10: '<i class="fas fa-coins" style="color:#FFEB3B;"></i>', // ذهبي (عملة)
    5: '<i class="fas fa-coins" style="color:#9C27B0;"></i>', // بنفسجي (عملة)
    1: '<i class="fas fa-coins" style="color:#795548;"></i>', // بني (عملة)
    0.5: '<i class="fas fa-coins" style="color:#607D8B;"></i>', // رمادي (نصف شيكل)
};

// عناصر الواجهة
const balanceIlsEl = document.getElementById('current-balance-ils');
const balanceUsdEl = document.getElementById('current-balance-usd');
const targetAmountDisplayEl = document.getElementById('target-amount-display');
const remainingAmountEl = document.getElementById('remaining-amount');
const targetPercentageEl = document.getElementById('target-percentage');
const progressBarFill = document.getElementById('progress-bar-fill');
const transactionListEl = document.getElementById('transaction-list');
const targetMessageEl = document.getElementById('target-message');
const addTransactionForm = document.getElementById('add-transaction-form');
const newAmountInput = document.getElementById('new-amount');
const transactionNoteInput = document.getElementById('transaction-note');
const resetDataButton = document.getElementById('reset-data-button'); 
const wishlistListEl = document.getElementById('wishlist-list');
const addWishForm = document.getElementById('add-wish-form');
const wishItemNameInput = document.getElementById('wish-item-name');
const wishItemPriceInput = document.getElementById('wish-item-price');
const totalWishlistSummaryEl = document.getElementById('total-wishlist-summary');
const changeTargetForm = document.getElementById('change-target-form');
const newTargetAmountInput = document.getElementById('new-target-amount');

// عناصر الإعدادات والـ Modal
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const musicElement = document.getElementById('background-music');
const toggleMusicButton = document.getElementById('toggle-music-button');
const bgColorSelect = document.getElementById('bg-color-select');
const webhookUrlInput = document.getElementById('webhook-url-input');
const saveWebhookButton = document.getElementById('save-webhook-button');
// عناصر مستوى الصوت
const volumeSlider = document.getElementById('volume-slider');
const volumeValueEl = document.getElementById('volume-value');

// عناصر البروفايل 
const profileButton = document.getElementById('profile-button');
const profileModal = document.getElementById('profile-modal');
const profileBalanceIlsEl = document.getElementById('profile-balance-ils');
const profileBalanceUsdEl = document.getElementById('profile-balance-usd');
const profileTargetAmountEl = document.getElementById('profile-target-amount');
const profileProgressBarFill = document.getElementById('profile-progress-bar-fill');
const profileProgressPercentageEl = document.getElementById('profile-progress-percentage');
const profileWishlistCountEl = document.getElementById('profile-wishlist-count');
const profileWishlistNeededEl = document.getElementById('profile-wishlist-needed');

const closeBtns = document.querySelectorAll('.close-btn'); 

// عناصر واجهة المستخدم الجديدة للفئات
const denominationsDisplayEl = document.getElementById('denominations-display');
const denominationsEditButton = document.getElementById('denominations-edit-button');
const denominationsModal = document.getElementById('denominations-modal');
const denominationsEditForm = document.getElementById('denominations-edit-form');
const denominationsListEditEl = document.getElementById('denominations-list-edit');

let transactions = [];
let wishlist = [];
let webhookUrl = '';

// ==========================================================
// وظائف الإشعارات (Discord Webhook) 
// ==========================================================
/**
 * @param {string} type نوع الإشعار: 'ADD', 'DELETE_TRANS', 'DELETE_WISH', 'GOAL_REACHED', 'DAILY_CHECK', 'TARGET_CHANGED', 'ADD_WISH'
 * @param {object} data بيانات الإشعار
 */
function sendDiscordNotification(type, data = {}) {
    if (!webhookUrl) {
        console.warn('Webhook URL غير موجود. لن يتم إرسال الإشعار.');
        return;
    }
    
    let title = '';
    let description = '';
    let color = 5793266; // أزرق افتراضي

    const currentTotal = calculateTotalBalance();
    
    const embed = {
        title: '',
        description: '',
        color: color, 
        fields: [
            { name: "📈 الرصيد الكلي الحالي", value: `**${currentTotal.toFixed(2)} ILS**`, inline: true },
            { name: "🎯 الهدف الحالي", value: `${TARGET_AMOUNT_ILS.toFixed(2)} ILS`, inline: true }
        ],
        timestamp: new Date().toISOString()
    };

    // بناء هيكل الإشعار حسب النوع
    switch (type) {
        case 'ADD':
            title = `💰 إيداع جديد في الحصالة!`;
            description = `تم إضافة مبلغ **${data.amount.toFixed(2)} ILS** بنجاح. \n**الملاحظة:** ${data.note}`;
            color = 3066993; // أخضر
            
            // إضافة تفاصيل الفئات إلى الإشعار
            if (data.addedDenominations) {
                const details = Object.entries(data.addedDenominations)
                    .filter(([d, c]) => c > 0)
                    .map(([d, c]) => `${c} x ${parseFloat(d).toFixed(parseFloat(d) % 1 === 0 ? 0 : 2)} ILS`)
                    .join('\n');
                embed.fields.push({ name: "💸 فئات الإيداع", value: details || "لا توجد تفاصيل فئات", inline: false });
            }
            break;
            
        case 'DELETE_TRANS':
            title = `🗑️ سحب مالي (حذف معاملة)`;
            description = `تم سحب/حذف معاملة بقيمة **${data.amount.toFixed(2)} ILS**. \n**سبب السحب:** **${data.deleteNote}**`;
            color = 15158332; // أحمر
            break;

        case 'DELETE_WISH':
            title = `❌ حذف أمنية`;
            description = `تم حذف الأمنية **${data.name}** التي كانت تكلفتها **${data.price.toFixed(2)} ILS**.`;
            color = 10038562; // بنفسجي
            break;

        case 'GOAL_REACHED':
            title = `🎯 هدف جديد تحقق!`;
            description = `🎉 مبروك! لقد تجاوزت الهدف بنجاح.`;
            color = 16776960; // ذهبي
            break;
            
        case 'DAILY_CHECK':
            title = `⏰ تذكير المصروف اليومي`;
            description = `هل أخذت مصروفك اليوم (${data.amount.toFixed(2)} ILS)؟ يرجى تسجيله في الموقع.`;
            color = 15844367; // أصفر
            break;

        case 'TARGET_CHANGED':
            title = `🎯 تحديث الهدف المالي`;
            description = `تم تغيير الهدف المالي من **${data.oldTarget.toFixed(2)} ILS** إلى **${data.newTarget.toFixed(2)} ILS**!`;
            color = 16751271; // برتقالي
            break;
            
        case 'ADD_WISH':
            title = `🎁 أمنية جديدة في القائمة`;
            description = `تم إضافة المنتج: **${data.name}** بتكلفة **${data.price.toFixed(2)} ILS**.`;
            color = 2277106; // سماوي
            break;


        default:
            return;
    }
    
    embed.title = title;
    embed.description = description;
    embed.color = color;

    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: "الحصالة الذكية", 
            avatar_url: "https://i.imgur.com/gK9fI5w.png", 
            embeds: [embed] 
        })
    })
    .then(response => {
        if (!response.ok) {
            console.error(`Failed to send Discord notification. Status: ${response.status} (Bad Request)`);
            // رسالة إضافية لتوضيح المشكلة
             console.error(`POST ${webhookUrl} net::ERR_ABORTED 400 (Bad Request)`);
        } else {
             console.log('Discord notification sent successfully.');
        }
    })
    .catch(error => {
        console.error('Error sending Discord notification (Network issue):', error);
    });
}


// ==========================================================
// وظائف عامة (Helper Functions)
// ==========================================================

function convertIlsToUsd(ils) {
    return ils * ILS_TO_USD_RATE;
}

function loadTarget() {
    const storedTarget = localStorage.getItem('moneyBoxTarget');
    if (storedTarget) {
        TARGET_AMOUNT_ILS = parseFloat(storedTarget);
    }
}

function saveTarget(newTarget) {
    TARGET_AMOUNT_ILS = newTarget;
    localStorage.setItem('moneyBoxTarget', newTarget.toFixed(2));
}

function loadSettings() {
    const storedColor = localStorage.getItem('moneyBoxBgColor') || 'default';
    applyColorTheme(storedColor);
    bgColorSelect.value = storedColor;

    const storedMusicState = localStorage.getItem('moneyBoxMusicPlaying') === 'true'; 
    updateMusicButton(storedMusicState, false); 
    
    // تحميل مستوى الصوت
    const storedVolume = localStorage.getItem('moneyBoxVolume') || '0.5';
    musicElement.volume = parseFloat(storedVolume);
    volumeSlider.value = storedVolume;
    volumeValueEl.textContent = `${Math.round(parseFloat(storedVolume) * 100)}%`;
    
    webhookUrl = localStorage.getItem('moneyBoxWebhookUrl') || '';
    webhookUrlInput.value = webhookUrl;
}

function applyColorTheme(theme) {
    const body = document.body;
    body.classList.remove('theme-blue', 'theme-red', 'theme-green');

    if (theme !== 'default') {
        body.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('moneyBoxBgColor', theme);
}

function updateMusicButton(isPlaying, shouldPlayPause) {
    if (isPlaying) {
        toggleMusicButton.innerHTML = 'إيقاف <i class="fas fa-pause"></i>';
        toggleMusicButton.className = 'button-red'; 
        
        if (shouldPlayPause) { 
            // 🐛 حل مشكلة Autoplay blocked/File not found 
            musicElement.play().then(() => {
                console.log("Music started playing successfully.");
            }).catch(error => {
                console.error(`Error playing music (${error.name}):`, error);
                
                // إعادة الزر لوضع التشغيل في حالة الفشل
                toggleMusicButton.innerHTML = 'تشغيل <i class="fas fa-play"></i>';
                toggleMusicButton.className = 'button-green';
            });
        }
    } else {
        toggleMusicButton.innerHTML = 'تشغيل <i class="fas fa-play"></i>';
        toggleMusicButton.className = 'button-green';
        if (shouldPlayPause) {
            musicElement.pause();
        }
    }
    localStorage.setItem('moneyBoxMusicPlaying', isPlaying);
}

function loadData() {
    loadTarget();
    loadSettings(); 

    const storedTransactions = localStorage.getItem('moneyBoxTransactions');
    const storedWishlist = localStorage.getItem('moneyBoxWishlist');

    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    } else {
        // إضافة الرصيد الأولي عند عدم وجود بيانات
        transactions.push({
            id: Date.now(),
            date: new Date().toLocaleTimeString('ar-EG') + ' ' + new Date().toLocaleDateString('ar-EG'),
            amountILS: INITIAL_BALANCE_ILS,
            amountUSD: convertIlsToUsd(INITIAL_BALANCE_ILS),
            note: 'رصيد أولي'
        });
    }

    if (storedWishlist) {
        wishlist = JSON.parse(storedWishlist);
    }
    
    // تحميل فئات النقود
    const storedDenominations = localStorage.getItem('cashDenominations');
    if (storedDenominations) {
        cashDenominations = JSON.parse(storedDenominations);
    } else {
        // تهيئة الفئات إلى صفر في أول مرة
        DENOMINATIONS.forEach(d => cashDenominations[d] = 0);
    }
}

function saveData() {
    localStorage.setItem('moneyBoxTransactions', JSON.stringify(transactions));
    localStorage.setItem('moneyBoxWishlist', JSON.stringify(wishlist));
    // حفظ فئات النقود
    localStorage.setItem('cashDenominations', JSON.stringify(cashDenominations));
}

function calculateTotalBalance() {
    let total = 0;
    transactions.forEach(t => {
        total += t.amountILS;
    });
    return total;
}

// دالة لإضافة المبلغ إلى فئات الأوراق النقدية
function addAmountToDenominations(amount) {
    const sortedDenominations = [...DENOMINATIONS].sort((a, b) => b - a);

    let remainingAmount = amount;
    const addedCounts = {};

    sortedDenominations.forEach(denomination => {
        if (remainingAmount >= denomination) {
            const count = Math.floor(remainingAmount / denomination);
            cashDenominations[denomination] = (cashDenominations[denomination] || 0) + count;
            remainingAmount -= count * denomination;
            addedCounts[denomination] = count;
        }
    });

    if (remainingAmount > 0.01) {
        // يتم تجاهل المبالغ الصغيرة جداً (أقل من أصغر فئة)
        console.warn(`تم ترك مبلغ بسيط لا يغطي أصغر فئة: ${remainingAmount.toFixed(2)} ILS`);
    }

    saveData();
    renderDenominationsDisplay();
    return addedCounts; // لإظهارها في الإشعار
}

// دالة لمعرفة كم يتبقى من الأوراق
function calculateTotalDenominations() {
    let total = 0;
    for (const [denomination, count] of Object.entries(cashDenominations)) {
        total += parseFloat(denomination) * count;
    }
    return total;
}

// دالة حذف معاملة (مع ملاحظة وحذف)
function deleteTransaction(id) {
    if (!confirm('هل أنت متأكد من حذف هذه المعاملة؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    
    const deletedTransaction = transactions.find(t => t.id === id); 
    if (!deletedTransaction) return;

    const deleteNote = prompt(`الرجاء كتابة سبب حذف المبلغ (${deletedTransaction.amountILS.toFixed(2)} ILS):`, "انسحب مني المصروف");
    
    if (deleteNote === null) {
        return; 
    }
    
    // حذف فئات النقود المقابلة للمعاملة المحذوفة 
    if (deletedTransaction.denominations) {
        for (const [denomination, count] of Object.entries(deletedTransaction.denominations)) {
            // نتأكد أننا لا نذهب تحت الصفر
            cashDenominations[denomination] = Math.max(0, (cashDenominations[denomination] || 0) - count); 
        }
    }

    transactions = transactions.filter(t => t.id !== id);
    
    saveData();
    renderTransactions();
    updateBalanceDisplay();
    renderDenominationsDisplay(); // تحديث عرض الفئات بعد الحذف
    
    sendDiscordNotification('DELETE_TRANS', { 
        amount: deletedTransaction.amountILS, 
        note: deletedTransaction.note,
        deleteNote: deleteNote.trim() || 'لا يوجد سبب محدد.'
    });
}

// دالة حذف أمنية (مع Webhook)
function deleteWishlistItem(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الأمنية؟')) return;
    
    const deletedWish = wishlist.find(w => w.id === id); 
    wishlist = wishlist.filter(w => w.id !== id);
    
    saveData();
    renderWishlist(calculateTotalBalance());
    updateWishlistSummary(calculateTotalBalance());
    
    if (deletedWish) {
        sendDiscordNotification('DELETE_WISH', { 
            name: deletedWish.name, 
            price: deletedWish.priceILS 
        });
    }
}

function resetAllData() {
    if (!confirm('تحذير! هل أنت متأكد من إعادة ضبط كل البيانات (الإيداعات والأمنيات)؟ هذا سيحذف كل شيء!')) return;

    localStorage.removeItem('moneyBoxTransactions');
    localStorage.removeItem('moneyBoxWishlist');
    localStorage.removeItem('lastDepositCheck');
    localStorage.removeItem('moneyBoxTarget'); 
    localStorage.removeItem('moneyBoxWebhookUrl'); 
    localStorage.removeItem('goalReached');
    localStorage.removeItem('cashDenominations'); // حذف الفئات النقدية 

    TARGET_AMOUNT_ILS = 2100; 
    transactions = [];
    wishlist = [];
    webhookUrl = ''; 
    loadData(); 
    
    renderTransactions();
    updateBalanceDisplay();
    renderDenominationsDisplay(); // تحديث عرض الفئات
    alert('تم إعادة ضبط جميع البيانات بنجاح.');
}

function addAutomaticTransaction(amountIls, note) {
    const addedDenominations = addAmountToDenominations(amountIls); // إضافة الفئات 
    
    const newTransaction = {
        id: Date.now(),
        date: new Date().toLocaleTimeString('ar-EG') + ' ' + new Date().toLocaleDateString('ar-EG'),
        amountILS: amountIls,
        amountUSD: convertIlsToUsd(amountIls),
        note: note,
        denominations: addedDenominations // حفظ الفئات 
    };

    transactions.push(newTransaction);
    saveData();
    renderTransaction(newTransaction);
    const currentTotal = calculateTotalBalance();
    updateBalanceDisplay();
    sendDiscordNotification('ADD', { amount: amountIls, note: note, addedDenominations: addedDenominations });
}

// دالة تذكير المصروف اليومي (مع Webhook)
function checkDailyDeposit() {
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    
    const targetDays = [0, 1, 3]; 

    const targetHour = 7;
    if (today.getHours() < targetHour) {
        return; 
    }

    if (targetDays.includes(dayOfWeek)) {
        const storedDate = localStorage.getItem('lastDepositCheck');
        
        let shouldAsk = true;
        if (storedDate) {
            const lastDepositCheckDate = new Date(storedDate);
            if (lastDepositCheckDate.toDateString() === today.toDateString()) {
                shouldAsk = false; 
            }
        }
        
        if (shouldAsk) {
            setTimeout(() => {
                sendDiscordNotification('DAILY_CHECK', { amount: WEEKLY_DEPOSIT_AMOUNT });
                
                if (confirm(`هل أخذت مصروفك اليوم (${WEEKLY_DEPOSIT_AMOUNT} شيكل)؟`)) {
                    addAutomaticTransaction(WEEKLY_DEPOSIT_AMOUNT, 'مصروف يومي (تلقائي)');
                }
                localStorage.setItem('lastDepositCheck', today.toISOString());
            }, 1000); 
        }
    }
}


// ==========================================================
// وظائف تحديث الواجهة (Render Functions)
// ==========================================================

// تحديث دالة العرض: التحقق من الوصول للهدف وإرسال Webhook
function updateBalanceDisplay() {
    const totalIls = calculateTotalBalance();
    const totalUsd = convertIlsToUsd(totalIls);
    const remaining = TARGET_AMOUNT_ILS - totalIls;
    const percentage = Math.min(100, (totalIls / TARGET_AMOUNT_ILS) * 100);
    
    const wasGoalReached = parseFloat(localStorage.getItem('goalReached')) === TARGET_AMOUNT_ILS;

    targetAmountDisplayEl.textContent = TARGET_AMOUNT_ILS.toFixed(2) + ' ILS'; 

    balanceIlsEl.textContent = totalIls.toFixed(2) + ' ILS';
    balanceUsdEl.textContent = totalUsd.toFixed(2) + ' USD';
    remainingAmountEl.textContent = remaining > 0 ? remaining.toFixed(2) + ' ILS' : '0.00 ILS';
    targetPercentageEl.textContent = percentage.toFixed(1) + '%';
    progressBarFill.style.width = percentage.toFixed(1) + '%';

    // التحقق من الهدف وإرسال الإشعار
    if (totalIls >= TARGET_AMOUNT_ILS && !wasGoalReached) {
        sendDiscordNotification('GOAL_REACHED', { currentTotal: totalIls, target: TARGET_AMOUNT_ILS });
        localStorage.setItem('goalReached', TARGET_AMOUNT_ILS.toFixed(2)); 
    } else if (totalIls < TARGET_AMOUNT_ILS) {
          localStorage.removeItem('goalReached');
    }

    checkTarget(totalIls);
    renderWishlist(totalIls);
    updateWishlistSummary(totalIls); 
    
    updateProfileModal(totalIls);
}

function checkTarget(currentBalance) {
    targetMessageEl.classList.remove('hidden');
    
    if (currentBalance >= TARGET_AMOUNT_ILS) {
        targetMessageEl.textContent = '🎉 مبروك! تجاوزت الهدف!';
        targetMessageEl.style.backgroundColor = '#4CAF50';
        targetMessageEl.style.color = '#fff';
    } else {
        targetMessageEl.textContent = `متبقي للهدف: ${(TARGET_AMOUNT_ILS - currentBalance).toFixed(2)} ILS`;
        targetMessageEl.style.backgroundColor = '#FFEB3B';
        targetMessageEl.style.color = '#121212';
    }
}


function renderTransaction(transaction) {
    const row = transactionListEl.insertRow(0); // Add at the top
    let denominationDetails = '';

    // عرض تفاصيل فئات الإيداع 
    if (transaction.denominations && Object.keys(transaction.denominations).length > 0) {
        const details = Object.entries(transaction.denominations)
            .filter(([d, c]) => c > 0)
            .map(([d, c]) => `${c} x ${parseFloat(d).toFixed(parseFloat(d) % 1 === 0 ? 0 : 2)}`)
            .join(' | ');
        denominationDetails = `<br><span class="details-note">**الفئات:** ${details}</span>`;
    }

    row.innerHTML = `
        <td>${transaction.date}</td>
        <td>${transaction.amountILS.toFixed(2)} ILS</td>
        <td>${transaction.amountUSD.toFixed(2)} USD</td>
        <td>${transaction.note} ${denominationDetails}</td>
        <td><button class="delete-btn" onclick="deleteTransaction(${transaction.id})"><i class="fas fa-times-circle"></i></button></td>
    `;
}

function renderTransactions() {
    transactionListEl.innerHTML = ''; // Clear existing
    // Reverse the array to show the latest transactions first
    [...transactions].reverse().forEach(t => renderTransaction(t)); 
}


function renderWishlist(currentBalance) {
    wishlistListEl.innerHTML = '';
    let totalWishlistCost = 0;

    wishlist.forEach(item => {
        totalWishlistCost += item.priceILS;
        const remaining = item.priceILS - currentBalance;
        const canBuy = currentBalance >= item.priceILS;
        
        const statusText = canBuy ? '✅ يمكن الشراء' : `⏳ تحتاج: ${remaining.toFixed(2)} ILS`;
        const statusClass = canBuy ? 'status-can-buy' : 'status-saving';

        const row = wishlistListEl.insertRow();
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.priceILS.toFixed(2)} ILS</td>
            <td>${convertIlsToUsd(item.priceILS).toFixed(2)} USD</td>
            <td class="${statusClass}">${statusText}</td>
            <td><button class="delete-btn" onclick="deleteWishlistItem(${item.id})"><i class="fas fa-times-circle"></i></button></td>
        `;
    });
}

function updateWishlistSummary(currentBalance) {
    const totalCost = wishlist.reduce((sum, item) => sum + item.priceILS, 0);
    const affordableCount = wishlist.filter(item => currentBalance >= item.priceILS).length;
    const itemsNeeded = wishlist.length - affordableCount;
    
    if (wishlist.length === 0) {
        totalWishlistSummaryEl.textContent = 'قائمة الأمنيات فارغة.';
        totalWishlistSummaryEl.style.backgroundColor = 'transparent';
        totalWishlistSummaryEl.style.color = '#fff';
    } else {
        totalWishlistSummaryEl.textContent = `جميع الأمنيات باقي لك **${(totalCost - currentBalance).toFixed(2)} ILS** لشراء كل شيء (الإجمالي: ${totalCost.toFixed(2)} ILS)`;
        
        if (itemsNeeded === 0) {
            totalWishlistSummaryEl.textContent = `🎉 لديك ما يكفي لشراء جميع الأمنيات! (الإجمالي: ${totalCost.toFixed(2)} ILS)`;
            totalWishlistSummaryEl.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
            totalWishlistSummaryEl.style.color = '#4CAF50';
        } else {
             totalWishlistSummaryEl.style.backgroundColor = 'rgba(255, 152, 0, 0.2)';
             totalWishlistSummaryEl.style.color = '#FF9800';
        }
    }
}


function updateProfileModal(currentBalance) {
    const totalIls = currentBalance;
    const totalUsd = convertIlsToUsd(totalIls);
    const percentage = Math.min(100, (totalIls / TARGET_AMOUNT_ILS) * 100);
    const totalWishlistCost = wishlist.reduce((sum, item) => sum + item.priceILS, 0);
    const itemsNeeded = wishlist.length - wishlist.filter(item => totalIls >= item.priceILS).length;

    profileBalanceIlsEl.textContent = totalIls.toFixed(2) + ' ILS';
    profileBalanceUsdEl.textContent = totalUsd.toFixed(2) + ' USD';
    profileTargetAmountEl.textContent = TARGET_AMOUNT_ILS.toFixed(2) + ' ILS';
    profileProgressBarFill.style.width = percentage.toFixed(1) + '%';
    profileProgressPercentageEl.textContent = percentage.toFixed(1) + '%';
    
    profileWishlistCountEl.textContent = ` لديك ${wishlist.length} أمنيات (المجموع: ${totalWishlistCost.toFixed(2)} ILS)`;
    profileWishlistNeededEl.textContent = itemsNeeded > 0 ? `متبقي لـ ${itemsNeeded} أمنيات.` : 'جاهز لشراء كل شيء!';
}

// 💸 دالة عرض الفئات في لوحة التحكم (المحدثة بالرموز) 💸
function renderDenominationsDisplay() {
    let html = '';
    const totalDenominations = calculateTotalDenominations();
    
    // التنبيه إذا كان مجموع الأوراق لا يساوي الرصيد الكلي
    const currentTotalBalance = calculateTotalBalance();
    if (Math.abs(currentTotalBalance - totalDenominations) > 0.05) {
        html += `<p style="color:var(--danger-color); font-weight:bold; margin-bottom:15px; background: rgba(244, 67, 54, 0.1); padding: 10px; border-radius: 6px;">
                    ⚠️ تحذير: مجموع الأوراق (${totalDenominations.toFixed(2)} ILS) لا يطابق الرصيد الكلي (${currentTotalBalance.toFixed(2)} ILS). يرجى الضبط يدوياً.
                </p>`;
    }

    // عرض الفئات (مرتبة من الأكبر للأصغر)
    const sortedDenominations = [...DENOMINATIONS].sort((a, b) => b - a);
    sortedDenominations.forEach(d => {
        const count = cashDenominations[d] || 0;
        if (count > 0 || d >= 1) { // عرض حتى أصغر عملة ورقية/معدنية
            const type = d >= 10 ? 'ورقة' : 'قطعة';
            const icon = DENOMINATION_ICONS[d] || '<i class="fas fa-coins"></i>';
            html += `
                <div class="denomination-item">
                    <span class="denom-value">${icon} ${d.toFixed(d % 1 === 0 ? 0 : 2)} ILS</span>
                    <span class="denom-count">X ${count} ${type}</span>
                    <span class="denom-total">= ${(d * count).toFixed(2)} ILS</span>
                </div>
            `;
        }
    });

    denominationsDisplayEl.innerHTML = html || '<p class="detail-text" style="color:#aaa;">لا توجد نقود مسجلة بعد.</p>';
}

// دالة إنشاء محتوى نموذج تعديل الفئات
function renderDenominationsEditForm() {
    denominationsListEditEl.innerHTML = '';
    const sortedDenominations = [...DENOMINATIONS].sort((a, b) => b - a);
    
    sortedDenominations.forEach(d => {
        const count = cashDenominations[d] || 0;
        const type = d >= 10 ? 'ورقة' : 'قطعة';
        
        const div = document.createElement('div');
        div.className = 'denomination-edit-item';
        div.innerHTML = `
            <label for="denom-input-${d}"><i class="fas fa-money-bill-alt"></i> ${d.toFixed(d % 1 === 0 ? 0 : 2)} شيكل (${type}):</label>
            <input type="number" id="denom-input-${d}" value="${count}" min="0" step="1">
        `;
        denominationsListEditEl.appendChild(div);
    });
}


// ==========================================================
// معالجات الأحداث (Event Handlers)
// ==========================================================

settingsButton.addEventListener('click', () => {
    settingsModal.style.display = 'block';
});

profileButton.addEventListener('click', () => {
    profileModal.style.display = 'block';
});

// معالج فتح نافذة تعديل الفئات 
denominationsEditButton.addEventListener('click', () => {
    renderDenominationsEditForm();
    denominationsModal.style.display = 'block';
});

// معالج حفظ تعديلات الفئات 
denominationsEditForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    DENOMINATIONS.forEach(d => {
        const input = document.getElementById(`denom-input-${d}`);
        if (input) {
            cashDenominations[d] = parseInt(input.value) || 0;
        }
    });

    saveData();
    renderDenominationsDisplay();
    // تحديث الرصيد الكلي بناءً على الأوراق الجديدة (هذا سيظهر التحذير إذا لم تتطابق الأرقام مع الرصيد الحقيقي)
    updateBalanceDisplay(); 
    denominationsModal.style.display = 'none';
    alert('تم حفظ تعديلات فئات النقود بنجاح. قد تحتاج لإعادة تعيين الرصيد الكلي إذا كان التحذير مستمراً.');
});


closeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modalId = e.target.getAttribute('data-modal');
        if (modalId) {
            document.getElementById(modalId).style.display = 'none';
        }
    });
});

window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
    if (e.target === profileModal) {
        profileModal.style.display = 'none';
    }
    if (e.target === denominationsModal) { // إغلاق نافذة الفئات 
        denominationsModal.style.display = 'none';
    }
});


addTransactionForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    const amountIls = parseFloat(newAmountInput.value);
    const noteText = transactionNoteInput.value.trim(); 
    
    if (isNaN(amountIls) || amountIls <= 0) {
        alert('الرجاء إدخال مبلغ صحيح وموجب.');
        return;
    }
    
    // استدعاء دالة إضافة الفئات 
    const addedDenominations = addAmountToDenominations(amountIls); 

    const newTransaction = {
        id: Date.now(),
        date: new Date().toLocaleTimeString('ar-EG') + ' ' + new Date().toLocaleDateString('ar-EG'),
        amountILS: amountIls,
        amountUSD: convertIlsToUsd(amountIls),
        note: noteText,
        denominations: addedDenominations // حفظ الفئات التي تم إيداعها 
    };

    transactions.push(newTransaction);
    saveData();
    renderTransaction(newTransaction);
    const currentTotal = calculateTotalBalance();
    updateBalanceDisplay(); 
    
    sendDiscordNotification('ADD', { amount: amountIls, note: noteText, addedDenominations: addedDenominations }); 
    
    newAmountInput.value = '';
    transactionNoteInput.value = '';
});

// معالج إضافة أمنية 
addWishForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = wishItemNameInput.value.trim();
    const priceIls = parseFloat(wishItemPriceInput.value);

    if (!name || isNaN(priceIls) || priceIls <= 0) {
        alert('الرجاء إدخال اسم وسعر صحيح للأمنية.');
        return;
    }

    const newWish = {
        id: Date.now(),
        name: name,
        priceILS: priceIls,
        priceUSD: convertIlsToUsd(priceIls)
    };

    wishlist.push(newWish);
    saveData();
    renderWishlist(calculateTotalBalance());
    updateWishlistSummary(calculateTotalBalance());
    
    sendDiscordNotification('ADD_WISH', { name: name, price: priceIls });

    wishItemNameInput.value = '';
    wishItemPriceInput.value = '';
});

// معالج تغيير الهدف
changeTargetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTarget = parseFloat(newTargetAmountInput.value);
    
    if (isNaN(newTarget) || newTarget <= 0) {
        alert('الرجاء إدخال مبلغ هدف صحيح وموجب.');
        return;
    }

    const oldTarget = TARGET_AMOUNT_ILS;
    saveTarget(newTarget);
    updateBalanceDisplay();
    newTargetAmountInput.value = '';

    sendDiscordNotification('TARGET_CHANGED', { oldTarget: oldTarget, newTarget: newTarget });
});

resetDataButton.addEventListener('click', resetAllData);

// 🛠️ معالج زر تشغيل الموسيقى
toggleMusicButton.addEventListener('click', () => {
    const isPlaying = !musicElement.paused;
    updateMusicButton(!isPlaying, true);
});

// 🛠️ معالج شريط التحكم بالصوت
volumeSlider.addEventListener('input', (e) => {
    const newVolume = parseFloat(e.target.value);
    musicElement.volume = newVolume;
    localStorage.setItem('moneyBoxVolume', newVolume);
    volumeValueEl.textContent = `${Math.round(newVolume * 100)}%`;
});

// 🛠️ معالج حفظ رابط الـ Webhook
saveWebhookButton.addEventListener('click', () => {
    const newWebhookUrl = webhookUrlInput.value.trim();
    webhookUrl = newWebhookUrl;
    localStorage.setItem('moneyBoxWebhookUrl', newWebhookUrl);
    alert('تم حفظ رابط الـ Webhook بنجاح.');
});

// 🛠️ معالج تغيير الثيم
bgColorSelect.addEventListener('change', (e) => {
    applyColorTheme(e.target.value);
});


function init() {
    loadData();
    renderTransactions();
    updateBalanceDisplay();
    checkDailyDeposit(); 
    // تشغيل دالة عرض الفئات عند بدء التشغيل 
    renderDenominationsDisplay(); 
}


init();
