package com.example.fms.ui.screens.farmer.herd

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.data.model.CattleRecord
import com.example.fms.ui.components.buttons.IslandButton
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.InsetGroup
import com.example.fms.ui.components.common.InsetRow
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.components.modals.IslandModal
import com.example.fms.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HerdOverviewScreen(
    onBackClick: () -> Unit = {},
    onAnimalSelected: (CattleRecord) -> Unit = {},
    onAddAnimalClick: () -> Unit = {}
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf("ALL") }

    var showAddAnimalModal by remember { mutableStateOf(false) }
    var newTagNumber by remember { mutableStateOf("") }
    var newCowName by remember { mutableStateOf("") }
    var newBreed by remember { mutableStateOf("Friesian") }
    var newStatus by remember { mutableStateOf("Healthy") }
    var newYield by remember { mutableStateOf("26.0") }
    var hasError by remember { mutableStateOf(false) }

    var herd by remember {
        mutableStateOf(
            listOf(
                CattleRecord("1", "#104", "Bessie", "Friesian", "Healthy", 25.5),
                CattleRecord("2", "#108", "Daisy", "Ayrshire", "Healthy", 33.5),
                CattleRecord("3", "#112", "Bella", "Jersey", "In Treatment", 21.5),
                CattleRecord("4", "#119", "Rosie", "Guernsey", "Pregnant", 0.0),
                CattleRecord("5", "#124", "Clara", "Friesian", "Healthy", 28.0),
                CattleRecord("6", "#130", "Penny", "Mixed", "Dry", 0.0)
            )
        )
    }

    val filteredHerd = herd.filter { cow ->
        val matchesSearch = cow.name.contains(searchQuery, ignoreCase = true) ||
                cow.tagNumber.contains(searchQuery, ignoreCase = true) ||
                cow.breed.contains(searchQuery, ignoreCase = true)
        val matchesFilter = when (selectedFilter) {
            "ALL" -> true
            "HEALTHY" -> cow.healthStatus == "Healthy"
            "TREATMENT" -> cow.healthStatus == "In Treatment"
            "DRY_PREGNANT" -> cow.healthStatus == "Dry" || cow.healthStatus == "Pregnant"
            else -> true
        }
        matchesSearch && matchesFilter
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Farm Herd",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${herd.size} Cattle Registered",
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
                    IconButton(onClick = {
                        showAddAnimalModal = true
                        onAddAnimalClick()
                    }) {
                        Surface(
                            shape = CircleShape,
                            color = EmeraldPrimary,
                            modifier = Modifier.size(36.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Rounded.Add, contentDescription = "Add Cow", tint = Color.White, modifier = Modifier.size(20.dp))
                            }
                        }
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Search Bar Island
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 2.dp
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Search,
                        contentDescription = "Search",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search by ear tag, name, or breed...", fontSize = 13.sp) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color.Transparent,
                            unfocusedBorderColor = Color.Transparent
                        ),
                        singleLine = true
                    )
                }
            }

            // Quick Filter Chips
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp)
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                HerdFilterChip("ALL", "All (${herd.size})", selectedFilter == "ALL") { selectedFilter = "ALL" }
                HerdFilterChip("HEALTHY", "Healthy (${herd.count { it.healthStatus == "Healthy" }})", selectedFilter == "HEALTHY") { selectedFilter = "HEALTHY" }
                HerdFilterChip("TREATMENT", "In Treatment (${herd.count { it.healthStatus == "In Treatment" }})", selectedFilter == "TREATMENT") { selectedFilter = "TREATMENT" }
                HerdFilterChip("DRY_PREGNANT", "Dry / In-Calf", selectedFilter == "DRY_PREGNANT") { selectedFilter = "DRY_PREGNANT" }
            }

            // Cattle List Inset Group
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(vertical = 8.dp)
            ) {
                item {
                    InsetGroup(
                        header = "Registered Cattle (${filteredHerd.size})",
                        footer = "Tap on any cow to view full veterinary pedigree, lactation cycle, and medical history."
                    ) {
                        if (filteredHerd.isEmpty()) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 24.dp),
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Text(
                                    text = "No cattle found matching criteria.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        } else {
                            filteredHerd.forEachIndexed { index, cow ->
                                val (statusBg, statusColor) = when (cow.healthStatus) {
                                    "Healthy" -> Pair(EmeraldPrimary.copy(alpha = 0.15f), EmeraldPrimary)
                                    "In Treatment" -> Pair(RoseRed.copy(alpha = 0.15f), RoseRed)
                                    "Pregnant" -> Pair(SkyBlue.copy(alpha = 0.15f), SkyBlue)
                                    else -> Pair(GoldAmber.copy(alpha = 0.15f), GoldAmber)
                                }

                                InsetRow(
                                    title = "${cow.name} (${cow.tagNumber})",
                                    subtitle = "${cow.breed} • Avg ${"%.1f".format(cow.dailyAvgYield)} L/day",
                                    leadingIcon = com.example.fms.ui.theme.CowIcon,
                                    iconTint = statusColor,
                                    iconBackgroundColor = statusBg,
                                    trailingBadge = cow.healthStatus,
                                    badgeColor = statusColor,
                                    showChevron = true,
                                    showDivider = index < filteredHerd.size - 1,
                                    onClick = { onAnimalSelected(cow) }
                                )
                            }
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(30.dp))
                }
            }
        }
    }

    // Add Animal iOS-Style ModalBottomSheet
    if (showAddAnimalModal) {
        ModalBottomSheet(
            onDismissRequest = {
                showAddAnimalModal = false
                hasError = false
            },
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
                            text = "Register New Animal",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Enter ear tag and basic pedigree vitals",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    PillBadge(
                        text = "NEW COW",
                        containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                        contentColor = EmeraldPrimary
                    )
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f))

                OutlinedTextField(
                    value = newTagNumber,
                    onValueChange = {
                        newTagNumber = it
                        if (it.isNotBlank()) hasError = false
                    },
                label = { Text("Ear Tag Number *") },
                placeholder = { Text("e.g. #145 or 145") },
                singleLine = true,
                isError = hasError && newTagNumber.isBlank(),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            OutlinedTextField(
                value = newCowName,
                onValueChange = {
                    newCowName = it
                    if (it.isNotBlank()) hasError = false
                },
                label = { Text("Animal Name *") },
                placeholder = { Text("e.g. Zawadi, Bella") },
                singleLine = true,
                isError = hasError && newCowName.isBlank(),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            Column {
                Text(
                    text = "Breed Selection",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("Friesian", "Ayrshire", "Jersey", "Guernsey", "Sahiwal", "Mixed").forEach { b ->
                        FilterChip(
                            selected = newBreed == b,
                            onClick = { newBreed = b },
                            label = { Text(b, fontSize = 12.sp) },
                            shape = RoundedCornerShape(16.dp),
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = EmeraldPrimary.copy(alpha = 0.2f),
                                selectedLabelColor = EmeraldPrimary
                            )
                        )
                    }
                }
            }

            Column {
                Text(
                    text = "Lactation / Health Status",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf("Healthy", "In Treatment", "Pregnant", "Dry").forEach { s ->
                        FilterChip(
                            selected = newStatus == s,
                            onClick = { newStatus = s },
                            label = { Text(s, fontSize = 12.sp) },
                            shape = RoundedCornerShape(16.dp),
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = EmeraldPrimary.copy(alpha = 0.2f),
                                selectedLabelColor = EmeraldPrimary
                            )
                        )
                    }
                }
            }

            OutlinedTextField(
                value = newYield,
                onValueChange = { newYield = it },
                label = { Text("Average Daily Yield (Liters)") },
                placeholder = { Text("e.g. 26.5") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            if (hasError) {
                Text(
                    text = "Please enter both an Ear Tag Number and Cow Name.",
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = {
                        showAddAnimalModal = false
                        hasError = false
                    },
                    modifier = Modifier.weight(1f).height(48.dp),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Text("Cancel", fontWeight = FontWeight.SemiBold)
                }

                Button(
                    onClick = {
                        if (newTagNumber.isBlank() || newCowName.isBlank()) {
                            hasError = true
                        } else {
                            val cleanTag = if (newTagNumber.startsWith("#")) newTagNumber.trim() else "#${newTagNumber.trim()}"
                            val newCow = CattleRecord(
                                id = (herd.size + 1).toString(),
                                tagNumber = cleanTag,
                                name = newCowName.trim(),
                                breed = newBreed,
                                healthStatus = newStatus,
                                dailyAvgYield = newYield.toDoubleOrNull() ?: 0.0
                            )
                            herd = listOf(newCow) + herd
                            newTagNumber = ""
                            newCowName = ""
                            hasError = false
                            showAddAnimalModal = false
                        }
                    },
                    modifier = Modifier.weight(1.5f).height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Register Cow", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
}

@Composable
fun CattleListItem(
    cow: CattleRecord,
    onClick: () -> Unit
) {
    val (statusBg, statusColor) = when (cow.healthStatus) {
        "Healthy" -> Pair(EmeraldPrimary.copy(alpha = 0.15f), EmeraldPrimary)
        "In Treatment" -> Pair(RoseRed.copy(alpha = 0.15f), RoseRed)
        "Pregnant" -> Pair(SkyBlue.copy(alpha = 0.15f), SkyBlue)
        else -> Pair(GoldAmber.copy(alpha = 0.15f), GoldAmber)
    }

    IslandCard(
        modifier = Modifier.fillMaxWidth(),
        elevation = 2.dp,
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = EmeraldPrimary.copy(alpha = 0.12f),
                    modifier = Modifier.size(46.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = com.example.fms.ui.theme.CowIcon,
                            contentDescription = null,
                            tint = EmeraldPrimary,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.width(14.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = cow.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = cow.tagNumber,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 12.sp,
                            color = EmeraldPrimary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${cow.breed} • Avg ${"%.1f".format(cow.dailyAvgYield)} L/day",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            PillBadge(
                text = cow.healthStatus,
                containerColor = statusBg,
                contentColor = statusColor,
                onClick = onClick
            )
        }
    }
}

@Composable
fun HerdFilterChip(
    id: String,
    title: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        color = if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)
        )
    ) {
        Text(
            text = title,
            fontSize = 12.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
        )
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Herd Overview Light")
@Composable
fun HerdOverviewScreenPreview() {
    FMSTheme(darkTheme = false) {
        HerdOverviewScreen()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Herd Overview Dark")
@Composable
fun HerdOverviewScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        HerdOverviewScreen()
    }
}
