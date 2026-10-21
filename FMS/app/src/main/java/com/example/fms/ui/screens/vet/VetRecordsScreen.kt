package com.example.fms.ui.screens.vet

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.Chat
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.HeroHeader
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

data class VetCaseRecord(
    val id: String,
    val farmName: String,
    val cowTag: String,
    val breed: String,
    val diagnosis: String,
    val treatmentDate: String,
    val prescribedDrugs: String,
    val withdrawalPeriodDays: Int,
    val status: String // ACTIVE, RESOLVED, FOLLOW_UP
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VetRecordsScreen(
    onBackClick: () -> Unit = {},
    onCaseSelected: (VetCaseRecord) -> Unit = {}
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf("ALL") }

    val records = remember {
        listOf(
            VetCaseRecord("rec1", "Baraka Dairy Farm", "COW-#104", "Friesian", "Acute Clinical Mastitis", "Oct 19, 2026", "Pen-Strep 20ml IM", 3, "ACTIVE"),
            VetCaseRecord("rec2", "Highland Ranch", "HEIFER-#88", "Ayrshire", "Interdigital Necrobacillosis (Foot Rot)", "Oct 15, 2026", "Oxytetracycline 20% LA", 7, "RESOLVED"),
            VetCaseRecord("rec3", "Kiprono Meadow", "CALF-#312", "Jersey", "Bovine Respiratory Disease (Pneumonia)", "Oct 10, 2026", "Florfenicol 15ml SC", 28, "RESOLVED"),
            VetCaseRecord("rec4", "Riverbend Dairy", "COW-#205", "Friesian", "Hypocalcemia (Milk Fever)", "Oct 04, 2026", "Calcium Borogluconate 400ml IV", 0, "RESOLVED")
        )
    }

    val filtered = records.filter {
        (selectedFilter == "ALL" || it.status == selectedFilter) &&
                (it.cowTag.contains(searchQuery, ignoreCase = true) || it.farmName.contains(searchQuery, ignoreCase = true) || it.diagnosis.contains(searchQuery, ignoreCase = true))
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Animal Medical Records", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("Clinical History & Treatment Logs", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
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
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Search Bar
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search by ear tag, farm, or illness...") },
                    leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    singleLine = true
                )
            }

            // Filter Chips
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = selectedFilter == "ALL",
                        onClick = { selectedFilter = "ALL" },
                        label = { Text("All Cases") },
                        shape = RoundedCornerShape(16.dp)
                    )
                    FilterChip(
                        selected = selectedFilter == "ACTIVE",
                        onClick = { selectedFilter = "ACTIVE" },
                        label = { Text("Active Withdrawal") },
                        shape = RoundedCornerShape(16.dp)
                    )
                    FilterChip(
                        selected = selectedFilter == "RESOLVED",
                        onClick = { selectedFilter = "RESOLVED" },
                        label = { Text("Resolved") },
                        shape = RoundedCornerShape(16.dp)
                    )
                }
            }

            items(filtered, key = { it.id }) { rec ->
                IslandCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onCaseSelected(rec) }
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(rec.cowTag, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            PillBadge(
                                text = if (rec.status == "ACTIVE") "Withdrawal Active (${rec.withdrawalPeriodDays}d)" else "Cleared",
                                containerColor = if (rec.status == "ACTIVE") RoseRed.copy(alpha = 0.15f) else EmeraldPrimary.copy(alpha = 0.15f),
                                contentColor = if (rec.status == "ACTIVE") RoseRed else EmeraldPrimary
                            )
                        }

                        Text("${rec.farmName} • ${rec.breed}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("Diagnosis: ${rec.diagnosis}", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        Text("Rx: ${rec.prescribedDrugs} (Date: ${rec.treatmentDate})", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(70.dp))
            }
        }
    }
}
