package com.example.fms.ui.screens.finance

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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.IslandButton
import com.example.fms.ui.components.IslandCard
import com.example.fms.ui.components.PillBadge
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

    val transactions = remember {
        listOf(
            TransactionItem("t1", "Dairy Cooperative Payout", "Milk Sales", 64800.0, true, "Oct 18, 2026", "MPESA-QK892L"),
            TransactionItem("t2", "High-Protein Dairy Meal (10 Bags)", "Feed Supplies", 28500.0, false, "Oct 16, 2026", "MPESA-PJ104K"),
            TransactionItem("t3", "Veterinary Vaccination Routine", "Healthcare", 4500.0, false, "Oct 14, 2026", "MPESA-NH482A"),
            TransactionItem("t4", "Private Consumer Bulk Order (120L)", "Milk Sales", 7200.0, true, "Oct 11, 2026", "MPESA-MB392P")
        )
    }

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
                            text = "Ledger & Subscription Plans",
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
            // Net Balance Horizon Card
            item {
                IslandCard(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = 6.dp
                ) {
                    Column(modifier = Modifier.padding(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "NET CASHFLOW (OCTOBER)",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    letterSpacing = 1.sp
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "KES 39,000",
                                    fontSize = 28.sp,
                                    fontWeight = FontWeight.Black,
                                    color = EmeraldPrimary
                                )
                            }
                            PillBadge(
                                text = "+18% vs Sep",
                                containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                contentColor = EmeraldPrimary
                            )
                        }

                        Spacer(modifier = Modifier.height(18.dp))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(text = "Gross Revenue", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(text = "KES 72,000", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(text = "Total Expenses", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(text = "KES 33,000", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = RoseRed)
                            }
                        }
                    }
                }
            }

            // Saturday Settlement & Payment Policy Island (As requested in requirements)
            item {
                IslandCard(
                    modifier = Modifier.fillMaxWidth(),
                    containerColor = GoldAmber.copy(alpha = 0.08f),
                    borderColor = GoldAmber.copy(alpha = 0.35f),
                    elevation = 2.dp
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = GoldAmber.copy(alpha = 0.2f),
                            modifier = Modifier.size(42.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Rounded.EventBusy,
                                    contentDescription = null,
                                    tint = GoldAmber,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Saturday Payment Freeze Active",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "No incoming or outgoing payments occur from Friday 6PM to Saturday 6PM. Plans automatically extend past every Saturday with zero lost active time.",
                                fontSize = 11.sp,
                                lineHeight = 15.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // External Web Billing Banner (Netflix-Style Web Routing)
            item {
                IslandCard(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = 4.dp
                ) {
                    Column(modifier = Modifier.padding(4.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = ForestGreen,
                                modifier = Modifier.size(42.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Rounded.WorkspacePremium,
                                        contentDescription = null,
                                        tint = EmeraldLight,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "FMS Enterprise Subscription",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "Active Plan: Unlimited Cattle & AI Diagnostic",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Text(
                            text = "To manage subscriptions, upgrade plans, or add payment methods, visit the FMS secure web portal.",
                            fontSize = 12.sp,
                            lineHeight = 16.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        IslandButton(
                            text = "Manage Subscription on Web",
                            icon = Icons.AutoMirrored.Rounded.OpenInNew,
                            onClick = {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(webCheckoutUrl))
                                context.startActivity(intent)
                            }
                        )
                    }
                }
            }

            // Recent Transactions Section Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Recent Transactions",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "M-Pesa Verified",
                        fontSize = 12.sp,
                        color = EmeraldPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            // Transactions List
            items(transactions) { tx ->
                TransactionRowItem(tx = tx)
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    // Web Billing External Modal
    if (showWebModal) {
        AlertDialog(
            onDismissRequest = { showWebModal = false },
            icon = {
                Icon(
                    imageVector = Icons.Rounded.Language,
                    contentDescription = null,
                    tint = EmeraldPrimary,
                    modifier = Modifier.size(44.dp)
                )
            },
            title = {
                Text(
                    text = "Manage Billing on Web",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    textAlign = TextAlign.Center
                )
            },
            text = {
                Text(
                    text = "Just like Netflix and Spotify, all billing changes, M-Pesa statements, and enterprise renewals are securely completed on the FMS Web Portal at fms-dairy.onrender.com.",
                    fontSize = 13.sp,
                    lineHeight = 18.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showWebModal = false
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(webCheckoutUrl))
                        context.startActivity(intent)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Open Browser")
                }
            },
            dismissButton = {
                TextButton(onClick = { showWebModal = false }) {
                    Text("Close")
                }
            },
            shape = RoundedCornerShape(24.dp)
        )
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
