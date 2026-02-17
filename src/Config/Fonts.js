import { Platform } from 'react-native';

// Poppins Font Family Mapping
export const PoppinsFonts = {
  // Regular weights
  Thin: Platform.OS === 'ios' ? 'Poppins-Thin' : 'Poppins-Thin',
  ExtraLight: Platform.OS === 'ios' ? 'Poppins-ExtraLight' : 'Poppins-ExtraLight',
  Light: Platform.OS === 'ios' ? 'Poppins-Light' : 'Poppins-Light',
  Regular: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins-Regular',
  Medium: Platform.OS === 'ios' ? 'Poppins-Medium' : 'Poppins-Medium',
  SemiBold: Platform.OS === 'ios' ? 'Poppins-SemiBold' : 'Poppins-SemiBold',
  Bold: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins-Bold',
  ExtraBold: Platform.OS === 'ios' ? 'Poppins-ExtraBold' : 'Poppins-ExtraBold',
  Black: Platform.OS === 'ios' ? 'Poppins-Black' : 'Poppins-Black',

  // Italic weights
  ThinItalic: Platform.OS === 'ios' ? 'Poppins-ThinItalic' : 'Poppins-ThinItalic',
  ExtraLightItalic: Platform.OS === 'ios' ? 'Poppins-ExtraLightItalic' : 'Poppins-ExtraLightItalic',
  LightItalic: Platform.OS === 'ios' ? 'Poppins-LightItalic' : 'Poppins-LightItalic',
  Italic: Platform.OS === 'ios' ? 'Poppins-Italic' : 'Poppins-Italic',
  MediumItalic: Platform.OS === 'ios' ? 'Poppins-MediumItalic' : 'Poppins-MediumItalic',
  SemiBoldItalic: Platform.OS === 'ios' ? 'Poppins-SemiBoldItalic' : 'Poppins-SemiBoldItalic',
  BoldItalic: Platform.OS === 'ios' ? 'Poppins-BoldItalic' : 'Poppins-BoldItalic',
  ExtraBoldItalic: Platform.OS === 'ios' ? 'Poppins-ExtraBoldItalic' : 'Poppins-ExtraBoldItalic',
  BlackItalic: Platform.OS === 'ios' ? 'Poppins-BlackItalic' : 'Poppins-BlackItalic',
};

// Backward compatibility - old naming convention
export const Fonts = {
  PoppinsRegular: 'Poppins-Regular',
  PoppinsBold: 'Poppins-Bold',
  PoppinsMedium: 'Poppins-Medium',
  PoppinsSemiBold: 'Poppins-SemiBold',
  PoppinsLight: 'Poppins-Light',
  PoppinsThin: 'Poppins-Thin',
  PoppinsExtraLight: 'Poppins-ExtraLight',
  PoppinsExtraBold: 'Poppins-ExtraBold',
  PoppinsBlack: 'Poppins-Black',
  PoppinsItalic: 'Poppins-Italic',
  PoppinsBoldItalic: 'Poppins-BoldItalic',
  PoppinsMediumItalic: 'Poppins-MediumItalic',
  PoppinsSemiBoldItalic: 'Poppins-SemiBoldItalic',
  PoppinsLightItalic: 'Poppins-LightItalic',
  PoppinsThinItalic: 'Poppins-ThinItalic',
  PoppinsExtraLightItalic: 'Poppins-ExtraLightItalic',
  PoppinsExtraBoldItalic: 'Poppins-ExtraBoldItalic',
  PoppinsBlackItalic: 'Poppins-BlackItalic',
};

// Font sizes
export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  xxxxl: 32,
};

// Font styles for common use cases
export const FontStyles = {
  heading: {
    fontFamily: Fonts.PoppinsBold,
    fontSize: FontSizes.xxl,
  },
  subheading: {
    fontFamily: Fonts.PoppinsSemiBold,
    fontSize: FontSizes.lg,
  },
  body: {
    fontFamily: Fonts.PoppinsRegular,
    fontSize: FontSizes.md,
  },
  caption: {
    fontFamily: Fonts.PoppinsLight,
    fontSize: FontSizes.sm,
  },
  button: {
    fontFamily: Fonts.PoppinsMedium,
    fontSize: FontSizes.md,
  },
};

// Helper function to get font family by weight
export const getPoppinsFont = (weight = 'Regular', italic = false) => {
  const weightKey = weight + (italic ? 'Italic' : '');
  return PoppinsFonts[weightKey] || PoppinsFonts.Regular;
};

// Helper function to create text style with Poppins font
export const createTextStyle = (fontWeight = 'Regular', fontSize = 16, color = '#000', italic = false) => ({
  fontFamily: getPoppinsFont(fontWeight, italic),
  fontSize,
  color,
});

export default PoppinsFonts;
