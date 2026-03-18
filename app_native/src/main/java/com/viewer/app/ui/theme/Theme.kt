package com.viewer.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

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

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryRed,
    onPrimary = Color.White,
    secondary = WarmOrange,
    onSecondary = Color.White,
    tertiary = DeepCrimson,
    onTertiary = Color.White,
    background = Color(0xFF121212),
    onBackground = Color(0xFFE2E8F0),
    surface = Color(0xFF1E1E1E),
    onSurface = Color(0xFFE2E8F0),
    surfaceVariant = Color(0xFF2D2D2D),
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = Color(0xFF475569),
    outlineVariant = Color(0xFF334155)
)

@Composable
fun ViewerTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        content = content
    )
}

