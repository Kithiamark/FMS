package com.example.fms.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

// Custom Vector Icon for Dairy Cow / Herd
val CowIcon: ImageVector
    get() = ImageVector.Builder(
        name = "CowIcon",
        defaultWidth = 24.dp,
        defaultHeight = 24.dp,
        viewportWidth = 24f,
        viewportHeight = 24f
    ).apply {
        // Horns & crown
        path(
            fill = null,
            stroke = SolidColor(Color.White),
            strokeLineWidth = 2f
        ) {
            moveTo(4f, 6f)
            curveTo(4f, 8f, 6f, 9f, 8f, 9f)
            curveTo(8f, 9f, 9f, 6f, 12f, 6f)
            curveTo(15f, 6f, 16f, 9f, 16f, 9f)
            curveTo(18f, 9f, 20f, 8f, 20f, 6f)
        }
        // Head contour
        path(
            fill = null,
            stroke = SolidColor(Color.White),
            strokeLineWidth = 2f
        ) {
            moveTo(6f, 9f)
            verticalLineTo(12.5f)
            arcTo(6f, 6f, 0f, isMoreThanHalf = false, isPositiveArc = false, 18f, 12.5f)
            verticalLineTo(9f)
        }
        // Left Ear
        path(
            fill = null,
            stroke = SolidColor(Color.White),
            strokeLineWidth = 1.8f
        ) {
            moveTo(6f, 10f)
            curveTo(3.5f, 10f, 2.5f, 9f, 2.5f, 7.5f)
            curveTo(2.5f, 6f, 4f, 6f, 6f, 7.5f)
        }
        // Right Ear
        path(
            fill = null,
            stroke = SolidColor(Color.White),
            strokeLineWidth = 1.8f
        ) {
            moveTo(18f, 10f)
            curveTo(20.5f, 10f, 21.5f, 9f, 21.5f, 7.5f)
            curveTo(21.5f, 6f, 20f, 6f, 18f, 7.5f)
        }
        // Muzzle / Snout rounded box
        path(
            fill = null,
            stroke = SolidColor(Color.White),
            strokeLineWidth = 1.8f
        ) {
            moveTo(10f, 14f)
            horizontalLineTo(14f)
            arcTo(3f, 3f, 0f, isMoreThanHalf = false, isPositiveArc = true, 17f, 17f)
            verticalLineTo(17.5f)
            arcTo(3f, 3f, 0f, isMoreThanHalf = false, isPositiveArc = true, 14f, 20.5f)
            horizontalLineTo(10f)
            arcTo(3f, 3f, 0f, isMoreThanHalf = false, isPositiveArc = true, 7f, 17.5f)
            verticalLineTo(17f)
            arcTo(3f, 3f, 0f, isMoreThanHalf = false, isPositiveArc = true, 10f, 14f)
            close()
        }
        // Left Nostril
        path(
            fill = SolidColor(Color.White)
        ) {
            moveTo(9.8f, 16.5f)
            arcTo(0.7f, 0.7f, 0f, isMoreThanHalf = true, isPositiveArc = true, 9.8f, 17.9f)
            arcTo(0.7f, 0.7f, 0f, isMoreThanHalf = true, isPositiveArc = true, 9.8f, 16.5f)
            close()
        }
        // Right Nostril
        path(
            fill = SolidColor(Color.White)
        ) {
            moveTo(14.2f, 16.5f)
            arcTo(0.7f, 0.7f, 0f, isMoreThanHalf = true, isPositiveArc = true, 14.2f, 17.9f)
            arcTo(0.7f, 0.7f, 0f, isMoreThanHalf = true, isPositiveArc = true, 14.2f, 16.5f)
            close()
        }
        // Eyes
        path(
            fill = SolidColor(Color.White)
        ) {
            moveTo(8.8f, 11f)
            arcTo(0.6f, 0.6f, 0f, isMoreThanHalf = true, isPositiveArc = true, 8.8f, 12.2f)
            arcTo(0.6f, 0.6f, 0f, isMoreThanHalf = true, isPositiveArc = true, 8.8f, 11f)
            close()
        }
        path(
            fill = SolidColor(Color.White)
        ) {
            moveTo(15.2f, 11f)
            arcTo(0.6f, 0.6f, 0f, isMoreThanHalf = true, isPositiveArc = true, 15.2f, 12.2f)
            arcTo(0.6f, 0.6f, 0f, isMoreThanHalf = true, isPositiveArc = true, 15.2f, 11f)
            close()
        }
    }.build()
