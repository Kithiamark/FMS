package com.example.fms.ui.screens.farmer.finance

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.buttons.IslandButton
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.InsetGroup
import com.example.fms.ui.components.common.InsetRow
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.components.modals.IslandModal
import com.example.fms.ui.theme.*

data class TransactionItem(
    val id: String,
    val title: String,
    val category: String,
    val amount: Double,
    val isIncome: Boolean,
    val date: String,
    val reference: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FinanceScreen(
    onBackClick: () -> Unit = {}
) {
    val context = LocalContext.current
    val webCheckoutUrl = "https://fms-dairy.onrender.com/finance" // Production Web Portal Payment URL

    var showWebModal by remember { mutableStateOf(false) }
    var showRecordModal by remember { mutableStateOf(false) }
    var isExpenseEntry by remember { mutableStateOf(true) } // true: Expense, false: Income

    var transactions by remember {
        mutableStateOf(
            listOf(
                TransactionItem("t1", "Dairy Cooperative Payout", "Milk Sales", 64800.0, true, "Oct 18, 2026", "MPESA-QK892L"),
                TransactionItem("t2", "High-Protein Dairy Meal (10 Bags)", "Feed Supplies", 28500.0, false, "Oct 16, 2026", "MPESA-PJ104K"),
                TransactionItem("t3", "Veterinary Vaccination Routine", "Healthcare", 4500.0, false, "Oct 14, 2026", "MPESA-NH482A"),
                TransactionItem("t4", "Private Consumer Bulk Order (120L)", "Milk Sales", 7200.0, true, "Oct 11, 2026", "MPESA-MB392P")
            )
        )
    }

    val totalIncome = transactions.filter { it.isIncome }.sumOf { it.amount }
    val totalExpense = transactions.filter { !it.isIncome }.sumOf { it.amount }
    val netCashflow = totalIncome - totalExpense

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Farm Financials",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Ledger, Expenses & Subscriptions",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showWebModal = true }) {
                        Icon(Icons.AutoMirrored.Rounded.OpenInNew, contentDescription = "Web Portal", tint = EmeraldPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    isExpenseEntry = true
                    showRecordModal = true
                },
                containerColor = EmeraldPrimary,
                contentColor = Color.White,
                shape = CircleShape,
                elevation = FloatingActionButtonDefaults.elevation(6.dp)
            ) {
                Icon(Icons.Rounded.Add, contentDescription = "Log Expense or Income")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Net Balance Group
            item {
                InsetGroup(
                    header = "Net Cashflow (October)",
                    footer = "Consolidated revenue from milk sales minus feeds, vet bills, and operational expenses."
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "KES ${"%,.0f".format(netCashflow)}",
                                fontSize = 30.sp,
                                fontWeight = FontWeight.Black,
                                color = if (netCashflow >= 0) EmeraldPrimary else RoseRed
                            )
                            PillBadge(
                                text = if (netCashflow >= 0) "+18% Net" else "Deficit",
                                containerColor = if (netCashflow >= 0) EmeraldPrimary.copy(alpha = 0.15f) else RoseRed.copy(alpha = 0.15f),
                                contentColor = if (netCashflow >= 0) EmeraldPrimary else RoseRed
                            )
                        }
                    }

                    InsetRow(
                        title = "Gross Revenue",
                        subtitle = "Co-op & retail milk intake",
                        leadingIcon = Icons.Rounded.TrendingUp,
                        iconTint = EmeraldPrimary,
                        iconBackgroundColor = EmeraldPrimary.copy(alpha = 0.12f),
                        trailingText = "KES ${"%,.0f".format(totalIncome)}",
                        showChevron = false,
                        showDivider = true
                    )

                    InsetRow(
                        title = "Total Expenses",
                        subtitle = "Feed, veterinary, and labor",
                        leadingIcon = Icons.Rounded.TrendingDown,
                        iconTint = RoseRed,
                        iconBackgroundColor = RoseRed.copy(alpha = 0.12f),
                        trailingText = "KES ${"%,.0f".format(totalExpense)}",
                        showChevron = false,
                        showDivider = false
                    )
                }
            }

            // Quick Actions: Log Expense / Income
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            isExpenseEntry = true
                            showRecordModal = true
                        },
                        modifier = Modifier.weight(1f).height(46.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(Icons.Rounded.RemoveCircleOutline, contentDescription = null, modifier = Modifier.size(18.dp), tint = RoseRed)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Log Expense", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = RoseRed)
                    }

                    Button(
                        onClick = {
                            isExpenseEntry = false
                            showRecordModal = true
                        },
                        modifier = Modifier.weight(1f).height(46.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                    ) {
                        Icon(Icons.Rounded.AddCircleOutline, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Log Income", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }

            // Subscription & Policy Inset Group
            item {
                InsetGroup(
                    header = "Subscription & Settlement",
                    footer = "Plan automatically extends past every Sabbath freeze with zero lost active time."
                ) {
                    InsetRow(
                        title = "FMS Enterprise Tier",
                        subtitle = "Active • Unlimited Cattle & AI Diagnostics",
                        leadingIcon = Icons.Rounded.WorkspacePremium,
                        iconTint = ForestGreen,
                        iconBackgroundColor = ForestGreen.copy(alpha = 0.12f),
                        trailingText = "Active",
                        showChevron = true,
                        showDivider = true,
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(webCheckoutUrl))
                            context.startActivity(intent)
                        }
                    )

                    InsetRow(
                        title = "Saturday Settlement Freeze",
                        subtitle = "Friday 6PM – Saturday 6PM Sabbath pause",
                        leadingIcon = Icons.Rounded.Schedule,
                        iconTint = GoldAmber,
                        iconBackgroundColor = GoldAmber.copy(alpha = 0.12f),
                        trailingBadge = "Protected",
                        badgeColor = GoldAmber,
                        showChevron = false,
                        showDivider = false
                    )
                }
            }

            // Recent Transactions Inset Group
            item {
                InsetGroup(
                    header = "Recent Transactions (${transactions.size})",
                    footer = "All M-Pesa business and co-op remittances are reconciled in real time."
                ) {
                    transactions.forEachIndexed { index, tx ->
                        InsetRow(
                            title = tx.title,
                            subtitle = "${tx.category} • ${tx.date} • ${tx.reference}",
                            leadingIcon = if (tx.isIncome) Icons.Rounded.ArrowDownward else Icons.Rounded.ArrowUpward,
                            iconTint = if (tx.isIncome) EmeraldPrimary else RoseRed,
                            iconBackgroundColor = if (tx.isIncome) EmeraldPrimary.copy(alpha = 0.12f) else RoseRed.copy(alpha = 0.12f),
                            trailingText = "${if (tx.isIncome) "+" else "-"} KES ${"%,.0f".format(tx.amount)}",
                            trailingBadge = if (tx.isIncome) "Income" else "Expense",
                            badgeColor = if (tx.isIncome) EmeraldPrimary else RoseRed,
                            showChevron = false,
                            showDivider = index < transactions.size - 1
                        )
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(60.dp))
            }
        }
    }

    // RECORD EXPENSE / INCOME iOS ModalBottomSheet
    if (showRecordModal) {
        var amountInput by remember { mutableStateOf("") }
        var descriptionInput by remember { mutableStateOf("") }
        var selectedCategory by remember { mutableStateOf(if (isExpenseEntry) "Feed" else "MilkSale") }

        val expenseCategories = listOf("Feed", "Veterinary", "Labor", "Equipment", "Utilities", "Other")
        val incomeCategories = listOf("MilkSale", "AnimalSale", "Other")

        ModalBottomSheet(
            onDismissRequest = { showRecordModal = false },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            dragHandle = {
                Box(
                    modifier = Modifier
                        .padding(top = 10.dp, bottom = 6.dp)
                        .width(36.dp)
                        .height(5.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                )
            }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 12.dp)
                    .navigationBarsPadding(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = if (isExpenseEntry) "Log Farm Expense" else "Log Farm Income",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = if (isExpenseEntry) "Record outgoing operational expenditure" else "Record incoming cash or milk remittance",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    PillBadge(
                        text = if (isExpenseEntry) "Outflow" else "Inflow",
                        containerColor = if (isExpenseEntry) RoseRed.copy(alpha = 0.15f) else EmeraldPrimary.copy(alpha = 0.15f),
                        contentColor = if (isExpenseEntry) RoseRed else EmeraldPrimary
                    )
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f))

                // Type Toggle
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                        .padding(4.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = if (isExpenseEntry) RoseRed else Color.Transparent,
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                isExpenseEntry = true
                                selectedCategory = "Feed"
                            }
                    ) {
                        Text(
                            text = "Expense",
                            modifier = Modifier.padding(vertical = 8.dp),
                            textAlign = TextAlign.Center,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = if (isExpenseEntry) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = if (!isExpenseEntry) EmeraldPrimary else Color.Transparent,
                        modifier = Modifier
                            .weight(1f)
                            .clickable {
                                isExpenseEntry = false
                                selectedCategory = "MilkSale"
                            }
                    ) {
                        Text(
                            text = "Income",
                            modifier = Modifier.padding(vertical = 8.dp),
                            textAlign = TextAlign.Center,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = if (!isExpenseEntry) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Amount Field
            OutlinedTextField(
                value = amountInput,
                onValueChange = { amountInput = it },
                label = { Text("Amount (KES)") },
                placeholder = { Text("e.g. 4500") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            // Category Chips
            Text("Category:", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            val currentCategories = if (isExpenseEntry) expenseCategories else incomeCategories
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                currentCategories.take(3).forEach { cat ->
                    FilterChip(
                        selected = selectedCategory == cat,
                        onClick = { selectedCategory = cat },
                        label = { Text(cat, fontSize = 11.sp) },
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }
            if (currentCategories.size > 3) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    currentCategories.drop(3).forEach { cat ->
                        FilterChip(
                            selected = selectedCategory == cat,
                            onClick = { selectedCategory = cat },
                            label = { Text(cat, fontSize = 11.sp) },
                            shape = RoundedCornerShape(10.dp)
                        )
                    }
                }
            }

            // Description Field
            OutlinedTextField(
                value = descriptionInput,
                onValueChange = { descriptionInput = it },
                label = { Text("Notes or Description") },
                placeholder = { Text("e.g. 5 bags dairy meal from agrovet") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = { showRecordModal = false },
                    modifier = Modifier.weight(1f).height(48.dp),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text("Cancel", fontWeight = FontWeight.SemiBold)
                }

                Button(
                    onClick = {
                        val parsedAmount = amountInput.toDoubleOrNull()
                        if (parsedAmount != null && parsedAmount > 0) {
                            val newTx = TransactionItem(
                                id = "tx_${System.currentTimeMillis()}",
                                title = descriptionInput.ifBlank { if (isExpenseEntry) selectedCategory else "Milk Sale" },
                                category = selectedCategory,
                                amount = parsedAmount,
                                isIncome = !isExpenseEntry,
                                date = "Today",
                                reference = "MPESA-${(1000..9999).random()}"
                            )
                            transactions = listOf(newTx) + transactions
                            showRecordModal = false
                        }
                    },
                    modifier = Modifier.weight(1.5f).height(48.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isExpenseEntry) RoseRed else EmeraldPrimary
                    ),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(if (isExpenseEntry) "Save Expense" else "Save Income", fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    // Web Billing External Modal
    if (showWebModal) {
        IslandModal(
            isOpen = showWebModal,
            onDismissRequest = { showWebModal = false },
            title = "Manage Billing on Web",
            icon = Icons.Rounded.Language,
            badgeText = "Portal Sync",
            confirmButton = {
                Button(
                    onClick = {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(webCheckoutUrl))
                        context.startActivity(intent)
                        showWebModal = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Open Browser", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showWebModal = false }) {
                    Text("Close")
                }
            }
        ) {
            Text(
                text = "In compliance with digital payment policies, recurring plans, M-Pesa billings, and custom invoices are managed via our verified portal.",
                fontSize = 13.sp,
                lineHeight = 18.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun TransactionRowItem(tx: TransactionItem) {
    IslandCard(
        modifier = Modifier.fillMaxWidth(),
        elevation = 2.dp
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = CircleShape,
                    color = if (tx.isIncome) EmeraldPrimary.copy(alpha = 0.12f) else RoseRed.copy(alpha = 0.12f),
                    modifier = Modifier.size(40.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = if (tx.isIncome) Icons.Rounded.ArrowDownward else Icons.Rounded.ArrowUpward,
                            contentDescription = null,
                            tint = if (tx.isIncome) EmeraldPrimary else RoseRed,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Text(
                        text = tx.title,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${tx.category} • ${tx.date}",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "${if (tx.isIncome) "+" else "-"} KES ${"%,.0f".format(tx.amount)}",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp,
                    color = if (tx.isIncome) EmeraldPrimary else MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = tx.reference,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Finance Screen Light")
@Composable
fun FinanceScreenPreview() {
    FMSTheme(darkTheme = false) {
        FinanceScreen()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Finance Screen Dark")
@Composable
fun FinanceScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        FinanceScreen()
    }
}
