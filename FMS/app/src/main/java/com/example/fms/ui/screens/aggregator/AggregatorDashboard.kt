package com.example.fms.ui.screens.aggregator

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.data.model.MilkBatch
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.HeroHeader
import com.example.fms.ui.components.common.InsetGroup
import com.example.fms.ui.components.common.InsetRow
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.components.modals.IslandModal
import com.example.fms.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AggregatorDashboard() {
    var batches by remember {
        mutableStateOf(
            listOf(
                MilkBatch("b1", "John Mwangi", "Baraka Dairy Cooperative", 280.0, "Accepted", "07:15 AM"),
                MilkBatch("b2", "Faith Chepkemoi", "Chepkemoi Hill Farm", 145.5, "Accepted", "07:45 AM"),
                MilkBatch("b3", "Kiprono Bett", "Sunrise Highland Pastoral", 92.0, "Pending Test", "08:10 AM"),
                MilkBatch("b4", "Samson Kiprop", "Riverbend Smallholders", 55.0, "Rejected", "08:35 AM")
            )
        )
    }

    val totalAcceptedLitres = batches.filter { it.status == "Accepted" }.sumOf { it.litres }
    val tankMaxCapacity = 5000.0 // 5,000 Litres chilling tank
    val tankFillRatio = (totalAcceptedLitres / tankMaxCapacity).toFloat().coerceIn(0f, 1f)

    var showIntakeDialog by remember { mutableStateOf(false) }
    var selectedBatchForReceipt by remember { mutableStateOf<MilkBatch?>(null) }

    val listState = androidx.compose.foundation.lazy.rememberLazyListState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        LazyColumn(
            state = listState,
            contentPadding = PaddingValues(bottom = 110.dp),
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // 1. Hero Header integrated seamlessly into scroll flow
            item {
                HeroHeader(
                    title = "Bulk Milk Intake Station",
                    subtitle = "Eldoret Chilling Hub • Station #03",
                    roleBadge = "AGGREGATOR HUB"
                )
            }

            // 2. Chilling Tank Status Inset Group
            item {
                InsetGroup(
                    header = "Chiller Storage & Quality QC",
                    footer = "Target dispatch to processing factory scheduled for 12:00 PM."
                ) {
                    InsetRow(
                        title = "Tank Fill Level",
                        subtitle = "${totalAcceptedLitres.toInt()} / ${tankMaxCapacity.toInt()} L Chilled (${(tankFillRatio * 100).toInt()}% Capacity)",
                        leadingIcon = Icons.Rounded.AcUnit,
                        iconTint = SkyBlue,
                        iconBackgroundColor = SkyBlue.copy(alpha = 0.12f),
                        trailingText = "3.6°C",
                        trailingBadge = "Optimal",
                        badgeColor = SkyBlue,
                        showChevron = false
                    )
                    InsetRow(
                        title = "New Intake & Lab Test",
                        subtitle = "Record farmer cans, lactometer density & alcohol test",
                        leadingIcon = Icons.Rounded.Science,
                        iconTint = EmeraldPrimary,
                        iconBackgroundColor = EmeraldPrimary.copy(alpha = 0.12f),
                        showChevron = true,
                        showDivider = false,
                        onClick = { showIntakeDialog = true }
                    )
                }
            }

            // 3. Today's Delivery Batches Inset Group
            item {
                InsetGroup(
                    header = "Today's Delivery Batches (${batches.size})",
                    footer = "Tap on any batch delivery to view lactometer density, fat % & payment receipt."
                ) {
                    batches.forEachIndexed { index, batch ->
                        val (statusBg, statusColor) = when (batch.status) {
                            "Accepted" -> Pair(EmeraldPrimary.copy(alpha = 0.15f), EmeraldPrimary)
                            "Pending Test" -> Pair(GoldAmber.copy(alpha = 0.15f), GoldAmber)
                            else -> Pair(RoseRed.copy(alpha = 0.15f), RoseRed)
                        }

                        InsetRow(
                            title = "${batch.farmerName} (${batch.farmName})",
                            subtitle = "Received at ${batch.time} • ${batch.litres} Litres",
                            leadingIcon = Icons.Rounded.LocalShipping,
                            iconTint = statusColor,
                            iconBackgroundColor = statusBg,
                            trailingText = "${batch.litres} L",
                            trailingBadge = batch.status,
                            badgeColor = statusColor,
                            showChevron = true,
                            showDivider = index < batches.size - 1,
                            onClick = { selectedBatchForReceipt = batch }
                        )
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(110.dp))
            }
        }

        // New Delivery & Quality Lab Test iOS ModalBottomSheet
        if (showIntakeDialog) {
            var farmerNameInput by remember { mutableStateOf("") }
            var litresInput by remember { mutableStateOf("") }
            var lactometerDensity by remember { mutableStateOf("29.0") } // Valid: 28-32
            var alcoholTestPassed by remember { mutableStateOf(true) }

            ModalBottomSheet(
                onDismissRequest = { showIntakeDialog = false },
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
                                text = "Milk Intake Quality Lab",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Standard intake QC test & lactometer check",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        PillBadge(
                            text = "Lab QC",
                            containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                            contentColor = EmeraldPrimary
                        )
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f))

                    OutlinedTextField(
                        value = farmerNameInput,
                        onValueChange = { farmerNameInput = it },
                        label = { Text("Farmer Name or Member ID *") },
                        placeholder = { Text("e.g. Kiprono Bett") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    OutlinedTextField(
                        value = litresInput,
                        onValueChange = { litresInput = it },
                        label = { Text("Volume Received (Litres) *") },
                        placeholder = { Text("e.g. 120.0") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Lactometer Density", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            Text("Standard: 28.0 - 32.0 @ 20°C", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        OutlinedTextField(
                            value = lactometerDensity,
                            onValueChange = { lactometerDensity = it },
                            modifier = Modifier.width(96.dp).height(48.dp),
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("68% Alcohol Clot Test", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            Text("Tests for bacterial acidity/spoilage", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        FilterChip(
                            selected = alcoholTestPassed,
                            onClick = { alcoholTestPassed = !alcoholTestPassed },
                            label = { Text(if (alcoholTestPassed) "Pass (Grade A)" else "Clotted (Fail)", fontSize = 12.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = if (alcoholTestPassed) EmeraldPrimary.copy(alpha = 0.15f) else RoseRed.copy(alpha = 0.15f),
                                selectedLabelColor = if (alcoholTestPassed) EmeraldPrimary else RoseRed
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedButton(
                            onClick = { showIntakeDialog = false },
                            modifier = Modifier.weight(1f).height(48.dp),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Text("Cancel", fontWeight = FontWeight.SemiBold)
                        }

                        Button(
                            onClick = {
                                val parsedLitres = litresInput.toDoubleOrNull() ?: 50.0
                                val isRejected = !alcoholTestPassed || (lactometerDensity.toDoubleOrNull() ?: 29.0) < 27.0
                                val newBatch = MilkBatch(
                                    id = "b_${System.currentTimeMillis()}",
                                    farmerName = if (farmerNameInput.isNotBlank()) farmerNameInput else "Unknown Member",
                                    farmName = "Intake Bay #1",
                                    litres = parsedLitres,
                                    status = if (isRejected) "Rejected" else "Accepted",
                                    time = "Just now"
                                )
                                batches = listOf(newBatch) + batches
                                showIntakeDialog = false
                            },
                            modifier = Modifier.weight(1.5f).height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Submit Batch", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Delivery Slip iOS ModalBottomSheet
        selectedBatchForReceipt?.let { batch ->
            val ratePerLitre = 52.0
            val grossPayout = batch.litres * ratePerLitre

            ModalBottomSheet(
                onDismissRequest = { selectedBatchForReceipt = null },
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
                                text = "Intake Delivery Voucher",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Official Cooperative Remittance Slip",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }

                        PillBadge(
                            text = batch.status,
                            containerColor = if (batch.status == "Accepted") EmeraldPrimary.copy(alpha = 0.15f) else RoseRed.copy(alpha = 0.15f),
                            contentColor = if (batch.status == "Accepted") EmeraldPrimary else RoseRed
                        )
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f))

                    InsetGroup(
                        header = "Batch Ledger Details"
                    ) {
                        InsetRow(
                            title = "Supplier",
                            subtitle = batch.farmName,
                            trailingText = batch.farmerName,
                            showChevron = false,
                            showDivider = true
                        )
                        InsetRow(
                            title = "Net Intake Volume",
                            subtitle = "Received at ${batch.time}",
                            trailingText = "${batch.litres} L",
                            showChevron = false,
                            showDivider = true
                        )
                        InsetRow(
                            title = "Base Contract Rate",
                            subtitle = "Standard A-Grade payout",
                            trailingText = "KES $ratePerLitre / L",
                            showChevron = false,
                            showDivider = true
                        )
                        InsetRow(
                            title = "Estimated Gross Payout",
                            subtitle = "Direct cooperative credit",
                            trailingText = "KES ${grossPayout.toInt()}",
                            iconTint = EmeraldPrimary,
                            iconBackgroundColor = EmeraldPrimary.copy(alpha = 0.12f),
                            trailingBadge = "Confirmed",
                            badgeColor = EmeraldPrimary,
                            showChevron = false,
                            showDivider = false
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Button(
                        onClick = { selectedBatchForReceipt = null },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Done", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Aggregator Dashboard Light")
@Composable
fun AggregatorDashboardPreview() {
    FMSTheme(darkTheme = false) {
        AggregatorDashboard()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Aggregator Dashboard Dark")
@Composable
fun AggregatorDashboardDarkPreview() {
    FMSTheme(darkTheme = true) {
        AggregatorDashboard()
    }
}
