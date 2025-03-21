let transactions = [];
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxDxsAzGviqgpMQNpRWeK_leXbBJIkNuy_Vwf9XkeFKs4ybTT3Xb5sIFi2a1lId75GReg/exec"; 

// Function to get the current month (e.g., "March 2025")
function getCurrentMonth() {
    let now = new Date();
    return `${now.toLocaleString("en-US", { month: "long" })} ${now.getFullYear()}`; 
}

function addTransaction(type) {
    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;

    if (!amount || !category) {
        alert("Please enter valid details");
        return;
    }

    let transaction = { type, amount, category };

    fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction)
    }).then(() => {
        transactions.push(transaction);
        updateUI();
        alert(`✅ Successfully added ${type === "income" ? "Income" : "Expense"} of ₨${amount} under ${category}!`);
    }).catch(err => console.log("Error:", err));
}

function fetchTransactions() {
    fetch(SHEET_URL)
        .then(response => response.json())
        .then(data => {
            transactions = data;
            updateUI();
        })
        .catch(err => console.log("Error fetching data:", err));
}

function updateUI() {
    let balance = 0;
    let totalIncome = 0;
    let totalSpent = 0;
    let currentMonthIncome = 0;
    let currentMonthSpent = 0;
    let currentMonth = getCurrentMonth(); // Get "March 2025"

    transactions.forEach((t) => {
        let amount = parseFloat(t.amount);
        if (isNaN(amount) || amount <= 0) return; // Ignore invalid values

        let transactionDate = new Date(t.date); // Convert timestamp to Date
        let transactionMonth = `${transactionDate.toLocaleString("en-US", { month: "long" })} ${transactionDate.getFullYear()}`;

        if (t.type === "income") {
            totalIncome += amount;
            if (transactionMonth === currentMonth) {
                currentMonthIncome += amount;
            }
        } else if (t.type === "expense") {
            totalSpent += amount;
            if (transactionMonth === currentMonth) {
                currentMonthSpent += amount;
            }
        }
    });

    // Balance = Total Income - Total Spent
    balance = totalIncome - totalSpent;

    // Fixing floating-point errors
    balance = Math.round(balance * 100) / 100;
    currentMonthIncome = Math.round(currentMonthIncome * 100) / 100;
    currentMonthSpent = Math.round(currentMonthSpent * 100) / 100;

    // Update UI
    document.getElementById("balance").innerText = `₨${balance.toFixed(2)}`;
    document.getElementById("summary").innerText = `${currentMonth}: You have received ₨${currentMonthIncome.toFixed(2)}, spent ₨${currentMonthSpent.toFixed(2)}, and have ₨${balance.toFixed(2)} remaining.`;
}

// 🔴 NEW: Remove last transaction
function removeLastTransaction() {
    if (transactions.length === 0) {
        alert("❌ No transactions to remove!");
        return;
    }

    let lastTransaction = transactions[transactions.length - 1]; // Get last transaction

    // Ask for confirmation before removing
    const confirmDelete = confirm(`❌ Are you sure you want to remove the last transaction?\n
    ${lastTransaction.type === "income" ? "🟢 Income" : "🔴 Expense"} - ₨${lastTransaction.amount} (${lastTransaction.category})`);

    if (!confirmDelete) return; // Stop if user cancels

    transactions.pop(); // Remove last transaction from array

    fetch(SHEET_URL, {
        method: "DELETE",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            type: lastTransaction.type, 
            amount: lastTransaction.amount, 
            category: lastTransaction.category 
        })
    }).then(() => {
        updateUI();
        alert("✅ Transaction successfully removed!");
    }).catch(err => {
        console.log("Error:", err);
        alert("❌ Error removing transaction! Please try again.");
    });
}

function formatDate(timestamp) {
    let date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function updateUI() {
    let balance = 0;
    let totalIncome = 0;
    let totalSpent = 0;
    let currentMonthIncome = 0;
    let currentMonthSpent = 0;
    let currentMonth = getCurrentMonth();

    const recentTransactionsList = document.getElementById("recent-transactions");
    recentTransactionsList.innerHTML = ""; // Clear old list

    transactions.slice(-15).reverse().forEach((t) => { // Show last 5 transactions
        let formattedDate = formatDate(t.timestamp || new Date()); // Convert timestamp

        let li = document.createElement("li");
        li.innerHTML = `${t.type === "income" ? "🟢" : "🔴"} <strong>₨${t.amount}</strong> - ${t.category} <span class="date">${formattedDate}</span>`;
        recentTransactionsList.appendChild(li);
    });

    transactions.forEach((t) => {
        let amount = parseFloat(t.amount);
        if (isNaN(amount) || amount <= 0) return;

        if (t.type === "income") {
            totalIncome += amount;
            if (t.month === currentMonth) {
                currentMonthIncome += amount;
            }
        } else if (t.type === "expense") {
            totalSpent += amount;
            if (t.month === currentMonth) {
                currentMonthSpent += amount;
            }
        }
    });

    balance = totalIncome - totalSpent;
    balance = Math.round(balance * 100) / 100;
    currentMonthIncome = Math.round(currentMonthIncome * 100) / 100;
    currentMonthSpent = Math.round(currentMonthSpent * 100) / 100;

    document.getElementById("balance").innerText = `₨${balance.toFixed(2)}`;
    document.getElementById("summary").innerText = `${currentMonth}: You have received ₨${currentMonthIncome.toFixed(2)}, spent ₨${currentMonthSpent.toFixed(2)}, and have ₨${balance.toFixed(2)} remaining.`;
}

// Load transactions when page loads
fetchTransactions();
