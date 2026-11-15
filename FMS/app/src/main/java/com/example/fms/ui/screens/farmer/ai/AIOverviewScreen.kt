package com.example.fms.ui.screens.farmer.ai

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.data.model.SubscriptionTier
import com.example.fms.ui.components.buttons.IslandButton
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

data class AIRecommendationCardData(
    val id: String,
    val type: String, // VET, FEED, PRODUCTION, BREEDING
    val priority: String, // URGENT, HIGH, MEDIUM, LOW
    val title: String,
    val description: String,
    val actionText: String,
    val isVetConsultation: Boolean = false
)

data class ProductionProjection(
    val day: String,
    val projectedLitres: Double,
    val isActual: Boolean = false
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AIOverviewScreen(
    currentTier: SubscriptionTier = SubscriptionTier.ENTERPRISE,
    onBackClick: () -> Unit = {},
    onConsultVetClick: () -> Unit = {},
    onUpgradePlanClick: () -> Unit = {}
) {
    var activeTier by remember { mutableStateOf(currentTier) }

    val recommendations = remember {
        listOf(
            AIRecommendationCardData(
                id = "r1",
                type = "VET",
                priority = "URGENT",
                title = "Immediate Vet Consultation Advised",
                description = "Bessie (#104) has experienced an abnormal 42% yield decline over 48 hours alongside elevated somatic warning indicators. Immediate California Mastitis Testing (CMT) is required.",
                actionText = "Consult KVB Certified Vet",
                isVetConsultation = true
            ),
            AIRecommendationCardData(
                id = "r2",
                type = "FEED",
                priority = "HIGH",
                title = "Adjust Concentrates for High Producers",
                description = "Daisy (#108) and Luna (#115) are sustaining >25L daily yield. Increase commercial dairy meal ration by +1.2 kg split across morning and evening milking to avoid body condition scoring loss.",
                actionText = "View Ration Breakdown",
                isVetConsultation = false
            ),
            AIRecommendationCardData(
                id = "r3",
                type = "PRODUCTION",
                priority = "MEDIUM",
                title = "Optimized Bulk Dispatches",
                description = "Aggregator tanker arrives at 07:15 AM tomorrow. Morning chilling tank is projected at 135.0 L, exceeding cooperative daily quota by 15.0 L available for premium spot retail.",
                actionText = "Reconcile Allocations",
                isVetConsultation = false
            ),
            AIRecommendationCardData(
                id = "r4",
                type = "BREEDING",
                priority = "LOW",
                title = "Estrus Detection Cycle Window",
                description = "Bella (#112) is approaching Day 21 of her natural cycle. Monitor standing heat behavior, clear mucus discharge, and vulval swelling between 05:00 AM and 08:00 AM.",
                actionText = "Log Heat Record",
                isVetConsultation = false
            )
        )
    }

    val sevenDayProjections = remember {
        listOf(
            ProductionProjection("Mon", 126.5, true),
            ProductionProjection("Tue", 128.0, true),
            ProductionProjection("Wed", 125.4, true),
            ProductionProjection("Thu", 131.2, false),
            ProductionProjection("Fri", 133.0, false),
            ProductionProjection("Sat", 134.5, false),
            ProductionProjection("Sun", 136.0, false)
        )
    }

    val isEnterprise = activeTier == SubscriptionTier.ENTERPRISE

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = CircleShape,
                            color = ForestGreen.copy(alpha = 0.15f),
                            modifier = Modifier.size(36.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Rounded.AutoAwesome,
                                    contentDescription = null,
                                    tint = ForestGreen,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Arvion AI Intelligence",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (isEnterprise) "Enterprise Predictive Engine" else "Basic Smallholder Intelligence",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = if (isEnterprise) ForestGreen.copy(alpha = 0.15f) else SkyBlue.copy(alpha = 0.15f),
                        modifier = Modifier.clickable {
                            activeTier = if (isEnterprise) SubscriptionTier.BASIC else SubscriptionTier.ENTERPRISE
                        }
                    ) {
                        Text(
                            text = if (isEnterprise) "Tier: Enterprise" else "Tier: Basic",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isEnterprise) ForestGreen else SkyBlue,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
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
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Plan Horizon Card
            item {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(22.dp),
                    color = if (isEnterprise) ForestGreen else SkyBlue,
                    shadowElevation = 4.dp
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(
                                    imageVector = if (isEnterprise) Icons.Rounded.WorkspacePremium else Icons.Rounded.Lightbulb,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(24.dp)
                                )
                                Text(
                                    text = if (isEnterprise) "Commercial Enterprise Plan" else "Smallholder Farmer Plan",
                                    color = Color.White,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = Color.White.copy(alpha = 0.25f)
                            ) {
                                Text(
                                    text = if (isEnterprise) "Full Model Access" else "Core Analytics",
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Text(
                            text = if (isEnterprise)
                                "Real-time 7-day multi-variable linear regression, somatic mastitis risk triage, herd health anomaly detection, and automated certified veterinary referral."
                            else
                                "Daily yield averages, baseline nutrition recommendations, and 3-day production preview. Upgrade to Enterprise to unlock 7-day predictive forecasting and disease alert triage.",
                            color = Color.White.copy(alpha = 0.9f),
                            fontSize = 12.sp,
                            lineHeight = 17.sp
                        )

                        if (!isEnterprise) {
                            Button(
                                onClick = onUpgradePlanClick,
                                colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.align(Alignment.End)
                            ) {
                                Text("Upgrade to Enterprise", color = ForestGreen, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

            // Production Forecast Section
            item {
                IslandCard(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = 2.dp
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "HERD YIELD FORECAST",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    letterSpacing = 0.5.sp
                                )
                                Text(
                                    text = if (isEnterprise) "7-Day Projected Output" else "3-Day Output Preview",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }

                            PillBadge(
                                text = if (isEnterprise) "94% Confidence" else "Basic Confidence",
                                containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                contentColor = EmeraldPrimary,
                                icon = Icons.Rounded.ShowChart
                            )
                        }

                        // Forecast Bars
                        val displayProjections = if (isEnterprise) sevenDayProjections else sevenDayProjections.take(3)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Bottom
                        ) {
                            displayProjections.forEach { p ->
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = "${p.projectedLitres.toInt()}L",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (p.isActual) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Box(
                                        modifier = Modifier
                                            .width(28.dp)
                                            .height(((p.projectedLitres - 110) * 3).dp.coerceIn(30.dp, 90.dp))
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(
                                                if (p.isActual) EmeraldPrimary
                                                else MaterialTheme.colorScheme.surfaceVariant
                                            )
                                    )
                                    Text(
                                        text = p.day,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }

                        if (!isEnterprise) {
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Rounded.Lock, contentDescription = null, tint = ForestGreen, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Days 4-7 locked. Upgrade to Enterprise to unlock full weekly linear projections.",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Recommendations Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Actionable Recommendations",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${recommendations.size} active",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Recommendations Cards
            items(recommendations) { rec ->
                val isUrgentVet = rec.isVetConsultation

                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = if (isUrgentVet) RoseRed.copy(alpha = 0.08f) else MaterialTheme.colorScheme.surface,
                    border = androidx.compose.foundation.BorderStroke(
                        width = if (isUrgentVet) 1.5.dp else 1.dp,
                        color = if (isUrgentVet) RoseRed.copy(alpha = 0.6f) else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    shadowElevation = if (isUrgentVet) 3.dp else 1.dp
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = if (isUrgentVet) RoseRed.copy(alpha = 0.15f) else EmeraldPrimary.copy(alpha = 0.15f),
                                    modifier = Modifier.size(34.dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(
                                            imageVector = if (isUrgentVet) Icons.Rounded.MedicalServices else Icons.Rounded.Insights,
                                            contentDescription = null,
                                            tint = if (isUrgentVet) RoseRed else EmeraldPrimary,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                                Column {
                                    Text(
                                        text = rec.title,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isUrgentVet) RoseRed else MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = "${rec.type} ADVISORY",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        letterSpacing = 0.5.sp
                                    )
                                }
                            }

                            PillBadge(
                                text = rec.priority,
                                containerColor = if (isUrgentVet) RoseRed.copy(alpha = 0.15f) else GoldAmber.copy(alpha = 0.15f),
                                contentColor = if (isUrgentVet) RoseRed else GoldAmber
                            )
                        }

                        Text(
                            text = rec.description,
                            fontSize = 12.sp,
                            lineHeight = 17.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            Button(
                                onClick = {
                                    if (isUrgentVet) onConsultVetClick()
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isUrgentVet) RoseRed else EmeraldPrimary
                                ),
                                shape = RoundedCornerShape(12.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                            ) {
                                if (isUrgentVet) {
                                    Icon(Icons.Rounded.LocalHospital, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                }
                                Text(
                                    text = rec.actionText,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }

            item {
                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }
}

@Preview(showBackground = true, name = "AI Overview Enterprise Light")
@Composable
fun AIOverviewScreenEnterprisePreview() {
    FMSTheme(darkTheme = false) {
        AIOverviewScreen(currentTier = SubscriptionTier.ENTERPRISE)
    }
}

@Preview(showBackground = true, name = "AI Overview Basic Dark")
@Composable
fun AIOverviewScreenBasicDarkPreview() {
    FMSTheme(darkTheme = true) {
        AIOverviewScreen(currentTier = SubscriptionTier.BASIC)
    }
}
