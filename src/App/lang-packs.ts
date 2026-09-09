// 语言包注册表: 每个应用目录内 lang.ts (含工具与固定页面)
// 本文件与各 lang.ts 由一次性脚本生成 (不在仓库内), 新增工具时需补建 lang.ts
import Hash from './Hash/lang';
import HmacHash from './HmacHash/lang';
import SHA3Hash from './SHA3Hash/lang';
import KeccakHash from './KeccakHash/lang';
import BcryptCalc from './BcryptCalc/lang';
import ScryptCalc from './ScryptCalc/lang';
import Base64 from './Base64/lang';
import URL from './URL/lang';
import Time from './Time/lang';
import Color from './Color/lang';
import ColorConvert from './ColorConvert/lang';
import NumberConvert from './NumberConvert/lang';
import TreePathConvert from './TreePathConvert/lang';
import QRCodeGenerator from './QRCodeGenerator/lang';
import BarcodeGenerator from './BarcodeGenerator/lang';
import AESCrypto from './AESCrypto/lang';
import RSACrypto from './RSACrypto/lang';
import SM2Crypto from './SM2Crypto/lang';
import SM4Crypto from './SM4Crypto/lang';
import CaesarCrypto from './CaesarCrypto/lang';
import RailFenceCrypto from './RailFenceCrypto/lang';
import VigenereCrypto from './VigenereCrypto/lang';
import HillCrypto from './HillCrypto/lang';
import CiscoType7 from './CiscoType7/lang';
import LineCount from './LineCount/lang';
import Unicode from './Unicode/lang';
import Punycode from './Punycode/lang';
import UUencode from './UUencode/lang';
import XXencode from './XXencode/lang';
import BCDCodec from './BCDCodec/lang';
import MorseCodec from './MorseCodec/lang';
import JWTDecoder from './JWTDecoder/lang';
import BasicAuthCodec from './BasicAuthCodec/lang';
import DESCrypto from './DESCrypto/lang';
import BlowfishCrypto from './BlowfishCrypto/lang';
import RabbitCrypto from './RabbitCrypto/lang';
import RC2Crypto from './RC2Crypto/lang';
import RC4Crypto from './RC4Crypto/lang';
import RC5Crypto from './RC5Crypto/lang';
import RC6Crypto from './RC6Crypto/lang';
import ChaCha20Crypto from './ChaCha20Crypto/lang';
import TripleDESCrypto from './TripleDESCrypto/lang';
import TEACrypto from './TEACrypto/lang';
import XTEACrypto from './XTEACrypto/lang';
import XXTEACrypto from './XXTEACrypto/lang';
import BaseXCodec from './BaseXCodec/lang';
import Base58Codec from './Base58Codec/lang';
import GzipCodec from './GzipCodec/lang';
import PBKDF2Calc from './PBKDF2Calc/lang';
import CMACCalc from './CMACCalc/lang';
import HKDFCalc from './HKDFCalc/lang';
import KMACCalc from './KMACCalc/lang';
import PPICalc from './PPICalc/lang';
import ComplementCalc from './ComplementCalc/lang';
import IPConvert from './IPConvert/lang';
import BCCCheck from './BCCCheck/lang';
import LRCCheck from './LRCCheck/lang';
import CRCCheck from './CRCCheck/lang';
import Base64Image from './Base64Image/lang';
import ImageColor from './ImageColor/lang';
import GPSConvert from './GPSConvert/lang';
import DownloadLinkConvert from './DownloadLinkConvert/lang';
import RMBConvert from './RMBConvert/lang';
import ByteConvert from './ByteConvert/lang';
import PinyinConvert from './PinyinConvert/lang';
import TemperatureConvert from './TemperatureConvert/lang';
import DistanceConvert from './DistanceConvert/lang';
import ConfigConvert from './ConfigConvert/lang';
import SubtitleConvert from './SubtitleConvert/lang';
import SpeedConvert from './SpeedConvert/lang';
import VolumeConvert from './VolumeConvert/lang';
import AreaConvert from './AreaConvert/lang';
import WeightConvert from './WeightConvert/lang';
import HtpasswdGenerator from './HtpasswdGenerator/lang';
import RegexTester from './RegexTester/lang';
import MarkdownEditor from './MarkdownEditor/lang';
import JsonFormatter from './JsonFormatter/lang';
import JSON5Formatter from './JSON5Formatter/lang';
import SQLFormatter from './SQLFormatter/lang';
import XmlFormatter from './XmlFormatter/lang';
import HtmlFormat from './HtmlFormat/lang';
import SvgFormat from './SvgFormat/lang';
import CnEnSpacing from './CnEnSpacing/lang';
import FileDiff from './FileDiff/lang';
import DotMatrixFont from './DotMatrixFont/lang';
import KeyboardKeyInfo from './KeyboardKeyInfo/lang';
import Chmod from './Chmod/lang';
import OTPGenerator from './OTPGenerator/lang';
import AsciiImageGenerator from './AsciiImageGenerator/lang';
import AsciiTextArt from './AsciiTextArt/lang';
import CronRules from './CronRules/lang';
import HtmlStripText from './HtmlStripText/lang';
import CodeShot from './CodeShot/lang';
import IcoGenerator from './IcoGenerator/lang';
import AppIconGenerator from './AppIconGenerator/lang';
import PlaceholderImage from './PlaceholderImage/lang';
import ShieldBadgeGenerator from './ShieldBadgeGenerator/lang';
import CIDRCalc from './CIDRCalc/lang';
import PasswordGenerator from './PasswordGenerator/lang';
import BrowserFingerprint from './BrowserFingerprint/lang';
import UrlExtract from './UrlExtract/lang';
import CookieAnalyzer from './CookieAnalyzer/lang';
import UserAgentParser from './UserAgentParser/lang';
import SitemapCheck from './SitemapCheck/lang';
import KeywordDensity from './KeywordDensity/lang';
import WebTDKCheck from './WebTDKCheck/lang';
import RobotsTxtGenerator from './RobotsTxtGenerator/lang';
import AppStore from './AppStore/lang';
import Setting from './Setting/lang';
import Help from './Help/lang';

export const langPacks = {
  Hash: Hash,
  HmacHash: HmacHash,
  SHA3Hash: SHA3Hash,
  KeccakHash: KeccakHash,
  BcryptCalc: BcryptCalc,
  ScryptCalc: ScryptCalc,
  Base64: Base64,
  URL: URL,
  Time: Time,
  Color: Color,
  ColorConvert: ColorConvert,
  NumberConvert: NumberConvert,
  TreePathConvert: TreePathConvert,
  QRCodeGenerator: QRCodeGenerator,
  BarcodeGenerator: BarcodeGenerator,
  AESCrypto: AESCrypto,
  RSACrypto: RSACrypto,
  SM2Crypto: SM2Crypto,
  SM4Crypto: SM4Crypto,
  CaesarCrypto: CaesarCrypto,
  RailFenceCrypto: RailFenceCrypto,
  VigenereCrypto: VigenereCrypto,
  HillCrypto: HillCrypto,
  CiscoType7: CiscoType7,
  LineCount: LineCount,
  Unicode: Unicode,
  Punycode: Punycode,
  UUencode: UUencode,
  XXencode: XXencode,
  BCDCodec: BCDCodec,
  MorseCodec: MorseCodec,
  JWTDecoder: JWTDecoder,
  BasicAuthCodec: BasicAuthCodec,
  DESCrypto: DESCrypto,
  BlowfishCrypto: BlowfishCrypto,
  RabbitCrypto: RabbitCrypto,
  RC2Crypto: RC2Crypto,
  RC4Crypto: RC4Crypto,
  RC5Crypto: RC5Crypto,
  RC6Crypto: RC6Crypto,
  ChaCha20Crypto: ChaCha20Crypto,
  TripleDESCrypto: TripleDESCrypto,
  TEACrypto: TEACrypto,
  XTEACrypto: XTEACrypto,
  XXTEACrypto: XXTEACrypto,
  BaseXCodec: BaseXCodec,
  Base58Codec: Base58Codec,
  GzipCodec: GzipCodec,
  PBKDF2Calc: PBKDF2Calc,
  CMACCalc: CMACCalc,
  HKDFCalc: HKDFCalc,
  KMACCalc: KMACCalc,
  PPICalc: PPICalc,
  ComplementCalc: ComplementCalc,
  IPConvert: IPConvert,
  BCCCheck: BCCCheck,
  LRCCheck: LRCCheck,
  CRCCheck: CRCCheck,
  Base64Image: Base64Image,
  ImageColor: ImageColor,
  GPSConvert: GPSConvert,
  DownloadLinkConvert: DownloadLinkConvert,
  RMBConvert: RMBConvert,
  ByteConvert: ByteConvert,
  PinyinConvert: PinyinConvert,
  TemperatureConvert: TemperatureConvert,
  DistanceConvert: DistanceConvert,
  ConfigConvert: ConfigConvert,
  SubtitleConvert: SubtitleConvert,
  SpeedConvert: SpeedConvert,
  VolumeConvert: VolumeConvert,
  AreaConvert: AreaConvert,
  WeightConvert: WeightConvert,
  HtpasswdGenerator: HtpasswdGenerator,
  RegexTester: RegexTester,
  MarkdownEditor: MarkdownEditor,
  JsonFormatter: JsonFormatter,
  JSON5Formatter: JSON5Formatter,
  SQLFormatter: SQLFormatter,
  XmlFormatter: XmlFormatter,
  HtmlFormat: HtmlFormat,
  SvgFormat: SvgFormat,
  CnEnSpacing: CnEnSpacing,
  FileDiff: FileDiff,
  DotMatrixFont: DotMatrixFont,
  KeyboardKeyInfo: KeyboardKeyInfo,
  Chmod: Chmod,
  OTPGenerator: OTPGenerator,
  AsciiImageGenerator: AsciiImageGenerator,
  AsciiTextArt: AsciiTextArt,
  CronRules: CronRules,
  HtmlStripText: HtmlStripText,
  CodeShot: CodeShot,
  IcoGenerator: IcoGenerator,
  AppIconGenerator: AppIconGenerator,
  PlaceholderImage: PlaceholderImage,
  ShieldBadgeGenerator: ShieldBadgeGenerator,
  CIDRCalc: CIDRCalc,
  PasswordGenerator: PasswordGenerator,
  BrowserFingerprint: BrowserFingerprint,
  UrlExtract: UrlExtract,
  CookieAnalyzer: CookieAnalyzer,
  UserAgentParser: UserAgentParser,
  SitemapCheck: SitemapCheck,
  KeywordDensity: KeywordDensity,
  WebTDKCheck: WebTDKCheck,
  RobotsTxtGenerator: RobotsTxtGenerator,
  AppStore,
  Setting,
  Help,
};
