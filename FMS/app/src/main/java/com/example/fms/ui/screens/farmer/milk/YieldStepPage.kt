package com.example.fms.ui.screens.farmer.milk

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Pets
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.EmeraldPrimary

data class CowMilkEntry(
    val animalId: String,
    val tagNumber: String,
    val name: String,
    var morningYield: String = "",
    var eveningYield: String = ""
) {
    val totalCowYield: Double
        get() = (morningYield.toDoubleOrNull() ?: 0.0) + (eveningYield.toDoubleOrNull() ?: 0.0)
}

@Composable
fun YieldStepPage(
    cows: List<CowMilkEntry>,
    onCowYieldChange: (String, String, String) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(cows, key = { it.animalId }) { cow ->
            IslandCard(modifier = Modifier.fillMaxWidth()) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Surface(
                                shape = CircleShape,
                                color = EmeraldPrimary.copy(alpha = 0.15f),
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(Icons.Rounded.Pets, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(18.dp))
                                }
                            }
                            Column {
                                Text(text = "${cow.name} (${cow.tagNumber})", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text(text = "Friesian • Lactation Stage 2", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }

                        if (cow.totalCowYield > 0) {
                            PillBadge(
                                text = "${"%.1f".format(cow.totalCowYield)} L",
                                containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                contentColor = EmeraldPrimary
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedTextField(
                            value = cow.morningYield,
                            onValueChange = { onCowYieldChange(cow.animalId, it, cow.eveningYield) },
                            label = { Text("Morning (AM)", fontSize = 12.sp) },
                            placeholder = { Text("0.0") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        )

                        OutlinedTextField(
                            value = cow.eveningYield,
                            onValueChange = { onCowYieldChange(cow.animalId, cow.morningYield, it) },
                            label = { Text("Evening (PM)", fontSize = 12.sp) },
                            placeholder = { Text("0.0") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                }
            }
        }
    }
}
