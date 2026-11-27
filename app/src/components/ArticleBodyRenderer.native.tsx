import React, { useMemo } from 'react';
import { Text, View, useWindowDimensions, Platform } from 'react-native';
import RenderHtml, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html';
import { WebView } from 'react-native-webview';
import { useAppTheme } from '../context/ThemeContext';
import { resolveArticleHtml } from '../utils/tiptapSerializer';

const customHTMLElementModels = {
  font: defaultHTMLElementModels.span.extend({
    contentModel: HTMLContentModel.mixed,
  }),
};

interface ArticleBodyRendererProps {
  contentJson?: any;
  contentHtml?: string | null;
  language?: 'en' | 'ta';
}

export default function ArticleBodyRenderer({
  contentJson,
  contentHtml,
}: ArticleBodyRendererProps) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();

  const html = useMemo(() => resolveArticleHtml(contentJson, contentHtml), [contentJson, contentHtml]);

  const tagsStyles = useMemo(
    () => ({
      p: { fontSize: 16, lineHeight: 26, color: colors.DarkText, marginBottom: 14 },
      h1: { fontSize: 24, fontWeight: 'bold' as const, color: colors.DarkText, marginTop: 18, marginBottom: 10 },
      h2: { fontSize: 21, fontWeight: 'bold' as const, color: colors.DarkText, marginTop: 16, marginBottom: 8 },
      h3: { fontSize: 18, fontWeight: 'bold' as const, color: colors.DarkText, marginTop: 14, marginBottom: 6 },
      a: { color: colors.PrimaryRed, textDecorationLine: 'underline' as const },
      blockquote: {
        borderLeftWidth: 4,
        borderLeftColor: colors.PrimaryRed,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginVertical: 12,
        fontStyle: 'italic' as const,
      },
      figcaption: { fontSize: 12, color: colors.Slate500, textAlign: 'center' as const, marginTop: 4 },
    }),
    [colors]
  );

  const renderers = useMemo(
    () => ({
      iframe: (props: any) => {
        const src = props?.tnode?.attributes?.src;
        if (!src) return null;
        return (
          <View style={{ width: '100%', height: 220, marginVertical: 12, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' }}>
            <WebView source={{ uri: src }} allowsFullscreenVideo javaScriptEnabled style={{ flex: 1 }} />
          </View>
        );
      },
      font: (props: any) => {
        const attrs = props?.tnode?.attributes || {};
        const style: any = {};
        if (attrs.color) style.color = attrs.color;
        if (attrs.face?.includes('Georgia')) style.fontFamily = Platform.OS === 'ios' ? 'Georgia' : 'serif';
        return <Text style={style}>{props.children}</Text>;
      },
    }),
    []
  );

  return (
    <RenderHtml
      contentWidth={Math.max(260, width - 48)}
      source={{ html: html || '<p></p>' }}
      tagsStyles={tagsStyles}
      renderers={renderers}
      customHTMLElementModels={customHTMLElementModels}
      baseStyle={{ color: colors.DarkText, fontSize: 16 }}
      enableExperimentalBRCollapsing
      enableExperimentalGhostLinesPrevention
    />
  );
}
