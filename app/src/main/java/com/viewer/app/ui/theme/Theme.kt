package com.viewer.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = PrimaryRed,
    onPrimary = SurfaceWhite,
    secondary = WarmOrange,
    onSecondary = SurfaceWhite,
    tertiary = DeepCrimson,
    onTertiary = SurfaceWhite,
    background = CreamBg,
    onBackground = DarkText,
    surface = SurfaceWhite,
    onSurface = DarkText,
    surfaceVariant = BackgroundLight,
    onSurfaceVariant = SlateText,
    outline = Slate200,
    outlineVariant = Slate100
)

@Composable
fun ViewerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = AppTypography,
        content = content
    )
}
