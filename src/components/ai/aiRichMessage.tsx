import { Fragment, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { kineticPalette } from '../../theme/kinetic';
import {
  parseInlineSegments,
  parseRichMessage,
  type InlineSegment,
} from './aiRichTextParser';

const renderInline = (segments: InlineSegment[], styles: ReturnType<typeof createStyles>, keyPrefix: string) =>
  segments.map((segment, index) => (
    <Text
      key={`${keyPrefix}-${index}`}
      style={[
        styles.inlineText,
        segment.bold && styles.inlineBold,
        segment.italic && styles.inlineItalic,
        segment.code && styles.inlineCode,
      ]}
    >
      {segment.text}
    </Text>
  ));

type AiRichMessageProps = {
  text: string;
  textColor?: string;
};

export function AiRichMessage({ text, textColor = kineticPalette.onSurface }: AiRichMessageProps) {
  const styles = useMemo(() => createStyles(textColor), [textColor]);
  const blocks = useMemo(() => parseRichMessage(text), [text]);

  return (
    <View style={styles.root}>
      {blocks.map((block, blockIndex) => {
        if (block.type === 'heading') {
          return (
            <Text
              key={`block-${blockIndex}`}
              style={[
                styles.block,
                styles.headingBase,
                block.level === 1 && styles.headingOne,
                block.level === 2 && styles.headingTwo,
                block.level === 3 && styles.headingThree,
              ]}
            >
              {renderInline(block.content, styles, `heading-${blockIndex}`)}
            </Text>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <Text key={`block-${blockIndex}`} style={[styles.block, styles.paragraph]}>
              {renderInline(block.content, styles, `paragraph-${blockIndex}`)}
            </Text>
          );
        }

        if (block.type === 'quote') {
          return (
            <View key={`block-${blockIndex}`} style={[styles.block, styles.quote]}>
              <Text style={styles.quoteText}>{renderInline(block.content, styles, `quote-${blockIndex}`)}</Text>
            </View>
          );
        }

        if (block.type === 'code') {
          return (
            <View key={`block-${blockIndex}`} style={[styles.block, styles.codeWrap]}>
              <Text style={styles.codeText}>{block.content}</Text>
            </View>
          );
        }

        if (block.type === 'list') {
          return (
            <View key={`block-${blockIndex}`} style={[styles.block, styles.listWrap]}>
              {block.items.map((item, itemIndex) => (
                <View key={`item-${itemIndex}`} style={styles.listRow}>
                  <Text style={styles.listMarker}>{block.ordered ? `${itemIndex + 1}.` : '•'}</Text>
                  <Text style={styles.listText}>{renderInline(item, styles, `list-${blockIndex}-${itemIndex}`)}</Text>
                </View>
              ))}
            </View>
          );
        }

        if (block.type === 'table') {
          return (
            <ScrollView
              key={`block-${blockIndex}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.block, styles.tableScroll]}
              contentContainerStyle={styles.tableScrollContent}
            >
              <View style={[styles.tableWrap, block.ascii && styles.asciiTableWrap]}>
                {block.headers ? (
                  <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    {block.headers.map((cell, cellIndex) => (
                      <View key={`header-${cellIndex}`} style={[styles.tableCell, styles.tableHeaderCell]}>
                        <Text style={styles.tableHeaderText}>
                          {renderInline(cell, styles, `table-header-${blockIndex}-${cellIndex}`)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {block.rows.map((row, rowIndex) => (
                  <View
                    key={`row-${rowIndex}`}
                    style={[
                      styles.tableRow,
                      rowIndex === block.rows.length - 1 && styles.tableRowLast,
                      block.ascii && styles.asciiRow,
                    ]}
                  >
                    {row.map((cell, cellIndex) => (
                      <View
                        key={`cell-${rowIndex}-${cellIndex}`}
                        style={[
                          styles.tableCell,
                          block.ascii && styles.asciiCell,
                          !block.ascii && cellIndex === row.length - 1 && styles.tableCellLast,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tableCellText,
                            block.ascii && cellIndex === 0 && styles.asciiKeyText,
                          ]}
                        >
                          {renderInline(cell, styles, `table-cell-${blockIndex}-${rowIndex}-${cellIndex}`)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          );
        }

        return <Fragment key={`block-${blockIndex}`} />;
      })}
    </View>
  );
}

const createStyles = (textColor: string) =>
  StyleSheet.create({
    root: {
      gap: 10,
    },
    block: {
      marginTop: 2,
    },
    inlineText: {
      color: textColor,
      fontSize: 15,
      lineHeight: 24,
    },
    inlineBold: {
      fontWeight: '800',
    },
    inlineItalic: {
      fontStyle: 'italic',
    },
    inlineCode: {
      fontFamily: 'monospace',
      backgroundColor: 'rgba(53, 37, 205, 0.08)',
      color: kineticPalette.primary,
    },
    headingBase: {
      color: textColor,
      fontWeight: '900',
    },
    headingOne: {
      fontSize: 22,
      lineHeight: 28,
    },
    headingTwo: {
      fontSize: 19,
      lineHeight: 25,
    },
    headingThree: {
      fontSize: 17,
      lineHeight: 23,
    },
    paragraph: {
      color: textColor,
      fontSize: 15,
      lineHeight: 24,
    },
    quote: {
      borderLeftWidth: 3,
      borderLeftColor: kineticPalette.secondaryContainer,
      paddingLeft: 12,
    },
    quoteText: {
      color: kineticPalette.onSurfaceVariant,
      fontSize: 14,
      lineHeight: 22,
      fontStyle: 'italic',
    },
    codeWrap: {
      borderRadius: 16,
      backgroundColor: '#0f172a',
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    codeText: {
      color: '#e2e8f0',
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'monospace',
    },
    listWrap: {
      gap: 8,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    listMarker: {
      width: 20,
      color: kineticPalette.primary,
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '800',
      textAlign: 'center',
    },
    listText: {
      flex: 1,
      color: textColor,
      fontSize: 15,
      lineHeight: 23,
    },
    tableScroll: {
      marginHorizontal: -2,
    },
    tableScrollContent: {
      paddingRight: 2,
    },
    tableWrap: {
      minWidth: 320,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: kineticPalette.outlineVariant,
      overflow: 'hidden',
      backgroundColor: kineticPalette.surfaceLowest,
    },
    asciiTableWrap: {
      minWidth: 280,
    },
    tableHeaderRow: {
      backgroundColor: kineticPalette.primaryFixed,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: kineticPalette.outlineVariant,
    },
    tableRowLast: {
      borderBottomWidth: 0,
    },
    asciiRow: {
      backgroundColor: kineticPalette.surfaceLowest,
    },
    tableCell: {
      minWidth: 140,
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRightWidth: 1,
      borderRightColor: kineticPalette.outlineVariant,
      justifyContent: 'center',
    },
    asciiCell: {
      minWidth: 128,
    },
    tableHeaderCell: {
      paddingVertical: 11,
    },
    tableCellLast: {
      borderRightWidth: 0,
    },
    tableHeaderText: {
      color: kineticPalette.primary,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '900',
    },
    tableCellText: {
      color: textColor,
      fontSize: 14,
      lineHeight: 20,
    },
    asciiKeyText: {
      fontWeight: '800',
      color: kineticPalette.onSurface,
    },
  });
