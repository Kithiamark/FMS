package com.example.fms.ui.components.common

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.theme.EmeraldDark
import com.example.fms.ui.theme.EmeraldLight
import com.example.fms.ui.theme.EmeraldPrimary
import com.example.fms.ui.theme.ForestGreen
import com.example.fms.ui.theme.RoseRed

/**
 * Pill Capsule Badge
 */
@Composable
fun PillBadge(
    text: String,
    containerColor: Color,
    contentColor: Color,
    icon: ImageVector? = null,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    Surface(
        modifier = modifier,
        shape = CircleShape,
        color = containerColor,
        contentColor = contentColor,
        onClick = onClick ?: {},
        enabled = onClick != null
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(12.dp)
                )
            }
            Text(
                text = text,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp,
                maxLines = 1,
                softWrap = false,
                overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
            )
        }
    }
}

/**
 * Sticky, Smoothly Compressing Hero Header
 * Compresses gracefully when scrolled or can be used statically with full smooth curved aesthetics.
 */
@Composable
fun HeroHeader(
    title: String,
    subtitle: String,
    roleBadge: String = "Enterprise",
    onNotificationClick: () -> Unit = {},
    notificationCount: Int = 3,
    scrollOffset: Float = 0f,
    maxScrollOffset: Float = 200f,
    modifier: Modifier = Modifier
) {
    // Fraction of collapse from 0f (fully expanded) to 1f (fully collapsed)
    val collapseFraction = (scrollOffset / maxScrollOffset).coerceIn(0f, 1f)

    // Animated values for silky smooth compression
    val animatedPaddingTop by animateDpAsState(
        targetValue = if (collapseFraction > 0.5f) 24.dp else 40.dp,
        label = "heroTopPadding"
    )
    val animatedPaddingBottom by animateDpAsState(
        targetValue = if (collapseFraction > 0.5f) 16.dp else 36.dp,
        label = "heroBottomPadding"
    )
    val animatedCornerRadius by animateDpAsState(
        targetValue = if (collapseFraction > 0.5f) 16.dp else 32.dp,
        label = "heroCorner"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(bottomStart = animatedCornerRadius, bottomEnd = animatedCornerRadius))
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        ForestGreen,
                        EmeraldDark
                    )
                )
            )
            .statusBarsPadding()
            .padding(
                start = 20.dp,
                end = 20.dp,
                top = animatedPaddingTop,
                bottom = animatedPaddingBottom
            )
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                if (collapseFraction < 0.6f) {
                    PillBadge(
                        text = roleBadge,
                        containerColor = EmeraldPrimary.copy(alpha = 0.25f),
                        contentColor = EmeraldLight
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                }

                Text(
                    text = title,
                    color = Color.White,
                    fontSize = if (collapseFraction > 0.5f) 19.sp else 23.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-0.5).sp,
                    maxLines = 1
                )

                if (collapseFraction < 0.6f) {
                    Text(
                        text = subtitle,
                        color = EmeraldLight.copy(alpha = 0.85f),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        maxLines = 1
                    )
                }
            }

            Surface(
                modifier = Modifier
                    .size(if (collapseFraction > 0.5f) 38.dp else 44.dp)
                    .clip(RoundedCornerShape(14.dp)),
                onClick = onNotificationClick,
                color = Color.White.copy(alpha = 0.16f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = "🔔",
                        fontSize = if (collapseFraction > 0.5f) 16.sp else 19.sp
                    )
                    if (notificationCount > 0) {
                        Surface(
                            shape = CircleShape,
                            color = RoseRed,
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .padding(4.dp)
                                .size(16.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = if (notificationCount > 99) "99+" else "$notificationCount",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Hero Header Light")
@Composable
fun HeroHeaderPreview() {
    com.example.fms.ui.theme.FMSTheme(darkTheme = false) {
        HeroHeader(
            title = "Kithia Dairy Farm",
            subtitle = "Active Enterprise Plan • 24 Cows in Milking",
            roleBadge = "FARM OWNER"
        )
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Hero Header Dark")
@Composable
fun HeroHeaderDarkPreview() {
    com.example.fms.ui.theme.FMSTheme(darkTheme = true) {
        HeroHeader(
            title = "Kithia Dairy Farm",
            subtitle = "Active Enterprise Plan • 24 Cows in Milking",
            roleBadge = "FARM OWNER"
        )
    }
}

/**
 * iOS-Style Inset Grouped Section Container
 * Replaces noisy, cluttered floating cards with sleek, continuous-radius grouped surfaces.
 */
@Composable
fun InsetGroup(
    modifier: Modifier = Modifier,
    header: String? = null,
    footer: String? = null,
    containerColor: Color = MaterialTheme.colorScheme.surface,
    shape: androidx.compose.ui.graphics.Shape = RoundedCornerShape(22.dp),
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
    ) {
        if (!header.isNullOrBlank()) {
            Text(
                text = header.uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.75f),
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.8.sp,
                modifier = Modifier.padding(start = 12.dp, bottom = 6.dp, top = 2.dp)
            )
        }

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = shape,
            color = containerColor,
            tonalElevation = 1.dp,
            shadowElevation = 0.5.dp,
            border = androidx.compose.foundation.BorderStroke(
                width = 0.75.dp,
                color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f)
            )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                content = content
            )
        }

        if (!footer.isNullOrBlank()) {
            Text(
                text = footer,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f),
                fontSize = 12.sp,
                modifier = Modifier.padding(start = 12.dp, top = 6.dp, end = 12.dp)
            )
        }
    }
}

/**
 * iOS-Style Inset Row with Leading Icon/Pill, Title, Subtitle, Value, and Trailing Accessory
 */
@Composable
fun InsetRow(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    leadingIcon: ImageVector? = null,
    iconTint: Color = EmeraldPrimary,
    iconBackgroundColor: Color = EmeraldPrimary.copy(alpha = 0.12f),
    trailingText: String? = null,
    trailingBadge: String? = null,
    badgeColor: Color = EmeraldPrimary,
    trailingContent: (@Composable () -> Unit)? = null,
    showChevron: Boolean = true,
    showDivider: Boolean = true,
    onClick: (() -> Unit)? = null
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .then(
                if (onClick != null) {
                    Modifier.clickable(onClick = onClick)
                } else Modifier
            )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.weight(1f, fill = false),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (leadingIcon != null) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(iconBackgroundColor),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = leadingIcon,
                            contentDescription = null,
                            tint = iconTint,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                }

                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (!subtitle.isNullOrBlank()) {
                        Text(
                            text = subtitle,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                if (!trailingBadge.isNullOrBlank()) {
                    PillBadge(
                        text = trailingBadge,
                        containerColor = badgeColor.copy(alpha = 0.15f),
                        contentColor = badgeColor
                    )
                }

                if (!trailingText.isNullOrBlank()) {
                    Text(
                        text = trailingText,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontWeight = FontWeight.Normal
                    )
                }

                if (trailingContent != null) {
                    trailingContent()
                }

                if (showChevron) {
                    Text(
                        text = "›",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Light,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                        modifier = Modifier.padding(start = 2.dp)
                    )
                }
            }
        }

        if (showDivider) {
            HorizontalDivider(
                modifier = Modifier.padding(start = if (leadingIcon != null) 62.dp else 16.dp),
                thickness = 0.6.dp,
                color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f)
            )
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Inset Group Light")
@Composable
fun InsetGroupPreview() {
    com.example.fms.ui.theme.FMSTheme(darkTheme = false) {
        InsetGroup(
            header = "Daily Milk Operations",
            footer = "Auto-balanced from morning and evening milking logs."
        ) {
            InsetRow(
                title = "Total Yield",
                subtitle = "Today across 24 cows",
                trailingText = "420.5 L",
                showChevron = true
            )
            InsetRow(
                title = "Milk Allocation",
                subtitle = "Factory & retail dispatched",
                trailingBadge = "Complete",
                showChevron = true,
                showDivider = false
            )
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Inset Group Dark")
@Composable
fun InsetGroupDarkPreview() {
    com.example.fms.ui.theme.FMSTheme(darkTheme = true) {
        InsetGroup(
            header = "Daily Milk Operations",
            footer = "Auto-balanced from morning and evening milking logs."
        ) {
            InsetRow(
                title = "Total Yield",
                subtitle = "Today across 24 cows",
                trailingText = "420.5 L",
                showChevron = true
            )
            InsetRow(
                title = "Milk Allocation",
                subtitle = "Factory & retail dispatched",
                trailingBadge = "Complete",
                showChevron = true,
                showDivider = false
            )
        }
    }
}

