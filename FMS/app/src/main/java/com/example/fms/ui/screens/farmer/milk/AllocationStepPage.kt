package com.example.fms.ui.screens.farmer.milk

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ChildCare
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Storefront
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

@Composable
fun AllocationStepPage(
    totalProduced: Double,
    calvesLitres: String,
    onCalvesChange: (String) -> Unit,
    homeUseLitres: String,
    onHomeUseChange: (String) -> Unit,
    soldLitres: String,
    onSoldChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val calvesVal = calvesLitres.toDoubleOrNull() ?: 0.0
    val homeVal = homeUseLitres.toDoubleOrNull() ?: 0.0
    val soldVal = soldLitres.toDoubleOrNull() ?: 0.0
    val totalAllocated = calvesVal + homeVal + soldVal
    val unallocated = totalProduced - totalAllocated

    LazyColumn(
        modifier = modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Summary Balance Island
        item {
            IslandCard(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Allocation Balance", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        PillBadge(
                            text = if (unallocated >= 0) "Balanced" else "Over-allocated",
                            containerColor = if (unallocated >= 0) EmeraldPrimary.copy(alpha = 0.15f) else RoseRed.copy(alpha = 0.15f),
                            contentColor = if (unallocated >= 0) EmeraldPrimary else RoseRed
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Total Produced", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("${"%.1f".format(totalProduced)} L", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
                        }
                        Column {
                            Text("Total Allocated", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("${"%.1f".format(totalAllocated)} L", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        }
                        Column {
                            Text("Unallocated", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(
                                text = "${"%.1f".format(unallocated)} L",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (unallocated < 0) RoseRed else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }
        }

        // Calves Feeding Allocation
        item {
            AllocationInputCard(
                title = "Calf Milk Allocation",
                subtitle = "Fed to unweaned calves across nursery pens",
                icon = Icons.Rounded.ChildCare,
                value = calvesLitres,
                onValueChange = onCalvesChange
            )
        }

        // Home Consumption Allocation
        item {
            AllocationInputCard(
                title = "Home & Farm Hands Use",
                subtitle = "Domestic consumption and worker tea rations",
                icon = Icons.Rounded.Home,
                value = homeUseLitres,
                onValueChange = onHomeUseChange
            )
        }

        // Cooperative / Buyer Bulk Sales Allocation
        item {
            AllocationInputCard(
                title = "Cooperative Bulk Sales",
                subtitle = "Dispatched to chilling hub / processor intake",
                icon = Icons.Rounded.Storefront,
                value = soldLitres,
                onValueChange = onSoldChange
            )
        }
    }
}

@Composable
private fun AllocationInputCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    value: String,
    onValueChange: (String) -> Unit
) {
    IslandCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = EmeraldPrimary.copy(alpha = 0.15f),
                    modifier = Modifier.size(40.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(icon, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(20.dp))
                    }
                }
                Column {
                    Text(title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(subtitle, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                placeholder = { Text("0.0") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                singleLine = true,
                modifier = Modifier.width(90.dp),
                shape = RoundedCornerShape(12.dp)
            )
        }
    }
}
