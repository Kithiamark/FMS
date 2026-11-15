package com.example.fms.ui.components.common

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
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

/**
 * Pill Capsule Badge
 */
@Composable
fun PillBadge(
    text: String,
    containerColor: Color,
    contentColor: Color,
    icon: ImageVector? = null,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = CircleShape,
        color = containerColor,
        contentColor = contentColor
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
                letterSpacing = 0.5.sp
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
                    .size(if (collapseFraction > 0.5f) 36.dp else 42.dp)
                    .clip(RoundedCornerShape(12.dp)),
                onClick = onNotificationClick,
                color = Color.White.copy(alpha = 0.15f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = "🔔",
                        fontSize = if (collapseFraction > 0.5f) 15.sp else 18.sp
                    )
                }
            }
        }
    }
}
