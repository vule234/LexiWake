import { memo, type ReactNode } from 'react';
import type {
  StyleProp,
  TextInputProps,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  kineticGradient,
  kineticPalette,
  kineticRadii,
  kineticShadow,
} from '../../theme/kinetic';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'glass';

export const KineticBackdrop = memo(function KineticBackdrop({
  variant = 'light',
}: {
  variant?: 'light' | 'brand';
}) {
  if (variant === 'brand') {
    return (
      <LinearGradient colors={kineticGradient} style={StyleSheet.absoluteFillObject}>
        <View style={[styles.orb, styles.brandOrbOne]} />
        <View style={[styles.orb, styles.brandOrbTwo]} />
      </LinearGradient>
    );
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={[styles.orb, styles.lightOrbOne]} />
      <View style={[styles.orb, styles.lightOrbTwo]} />
      <View style={[styles.orb, styles.lightOrbThree]} />
    </View>
  );
});

export function KineticButton({
  children,
  variant = 'primary',
  style,
  contentStyle,
  disabled,
  ...props
}: TouchableOpacityProps & {
  children: ReactNode;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const buttonStyle = [
    styles.button,
    variant === 'secondary' && styles.secondaryButton,
    variant === 'ghost' && styles.ghostButton,
    variant === 'glass' && styles.glassButton,
    disabled && styles.buttonDisabled,
    style,
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      disabled={disabled}
      style={buttonStyle}
      {...props}
    >
      {variant === 'primary' ? (
        <LinearGradient colors={kineticGradient} style={styles.primaryButtonGradient}>
          <View style={[styles.buttonContent, contentStyle]}>{children}</View>
        </LinearGradient>
      ) : (
        <View style={[styles.buttonContent, contentStyle]}>{children}</View>
      )}
    </TouchableOpacity>
  );
}

export function KineticButtonText({
  children,
  variant = 'primary',
  style,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[
        styles.buttonText,
        variant !== 'primary' && styles.secondaryButtonText,
        variant === 'ghost' && styles.ghostButtonText,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function KineticInput({
  label,
  icon,
  helperText,
  containerStyle,
  ...props
}: TextInputProps & {
  label: string;
  icon?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={containerStyle}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputShell}>
        {icon ? <Text style={styles.inputIcon}>{icon}</Text> : null}
        <TextInput
          placeholderTextColor={kineticPalette.outline}
          style={styles.input}
          {...props}
        />
      </View>
      {helperText ? <Text style={styles.inputHelper}>{helperText}</Text> : null}
    </View>
  );
}

export function KineticChoiceCard({
  title,
  description,
  icon,
  active,
  onPress,
  trailing,
}: {
  title: string;
  description: string;
  icon?: string;
  active?: boolean;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[styles.choiceCard, active && styles.choiceCardActive]}
    >
      <View style={styles.choiceIconWrap}>
        <View style={[styles.choiceIconCircle, active && styles.choiceIconCircleActive]}>
          <Text style={styles.choiceIcon}>{icon || '•'}</Text>
        </View>
      </View>
      <View style={styles.choiceBody}>
        <Text style={[styles.choiceTitle, active && styles.choiceTitleActive]}>{title}</Text>
        <Text style={[styles.choiceDescription, active && styles.choiceDescriptionActive]}>
          {description}
        </Text>
      </View>
      {trailing ? <View>{trailing}</View> : null}
    </TouchableOpacity>
  );
}

export function KineticGlassCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

export function KineticStepHeader({
  step,
  total,
  title,
  subtitle,
}: {
  step: number;
  total: number;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.stepHeader}>
      <Text style={styles.stepText}>
        Bước {String(step).padStart(2, '0')}/{String(total).padStart(2, '0')}
      </Text>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  lightOrbOne: {
    width: 240,
    height: 240,
    top: -90,
    right: -70,
    backgroundColor: 'rgba(172, 237, 255, 0.32)',
  },
  lightOrbTwo: {
    width: 300,
    height: 300,
    left: -120,
    bottom: 80,
    backgroundColor: 'rgba(226, 223, 255, 0.8)',
  },
  lightOrbThree: {
    width: 180,
    height: 180,
    right: 30,
    bottom: 200,
    backgroundColor: 'rgba(255, 221, 184, 0.22)',
  },
  brandOrbOne: {
    width: 360,
    height: 360,
    top: -120,
    right: -110,
    backgroundColor: 'rgba(87, 223, 254, 0.16)',
  },
  brandOrbTwo: {
    width: 280,
    height: 280,
    left: -90,
    bottom: -50,
    backgroundColor: 'rgba(255, 221, 184, 0.14)',
  },
  button: {
    borderRadius: kineticRadii.lg,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    borderRadius: kineticRadii.lg,
    ...kineticShadow,
  },
  secondaryButton: {
    backgroundColor: kineticPalette.surfaceLowest,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  glassButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  buttonContent: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    flexDirection: 'row',
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: kineticPalette.onPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: kineticPalette.onSurface,
  },
  ghostButtonText: {
    color: kineticPalette.primary,
  },
  inputLabel: {
    marginBottom: 8,
    marginLeft: 4,
    color: kineticPalette.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '700',
  },
  inputShell: {
    minHeight: 58,
    borderRadius: kineticRadii.md,
    backgroundColor: kineticPalette.surfaceHighest,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    color: kineticPalette.onSurface,
    fontSize: 16,
    paddingVertical: 16,
  },
  inputHelper: {
    marginTop: 8,
    marginLeft: 4,
    color: kineticPalette.outline,
    fontSize: 12,
    lineHeight: 18,
  },
  choiceCard: {
    borderRadius: kineticRadii.lg,
    backgroundColor: kineticPalette.surfaceLowest,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  choiceCardActive: {
    backgroundColor: kineticPalette.primaryFixed,
  },
  choiceIconWrap: {
    justifyContent: 'flex-start',
  },
  choiceIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(79, 70, 229, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIconCircleActive: {
    backgroundColor: kineticPalette.primaryContainer,
  },
  choiceIcon: {
    fontSize: 20,
  },
  choiceBody: {
    flex: 1,
    gap: 4,
  },
  choiceTitle: {
    color: kineticPalette.onSurface,
    fontSize: 18,
    fontWeight: '800',
  },
  choiceTitleActive: {
    color: kineticPalette.primary,
  },
  choiceDescription: {
    color: kineticPalette.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
  },
  choiceDescriptionActive: {
    color: kineticPalette.primaryContainer,
  },
  glassCard: {
    borderRadius: kineticRadii.lg,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    padding: 18,
  },
  stepHeader: {
    gap: 8,
  },
  stepText: {
    color: kineticPalette.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  stepTitle: {
    color: kineticPalette.onSurface,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
  },
  stepSubtitle: {
    color: kineticPalette.onSurfaceVariant,
    fontSize: 15,
    lineHeight: 22,
  },
});
