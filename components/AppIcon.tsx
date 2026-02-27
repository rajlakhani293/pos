import {
  FaSpinner,
  FaCheckCircle,
  FaRegCircle,
  FaInfo,
  FaChevronLeft,
  FaChevronRight,
  FaArrowRight,
  FaImage,
  FaSalesforce,
  FaTag,
} from 'react-icons/fa';
import {  MdCancel, MdOutlineInventory2, MdDelete} from 'react-icons/md';
import { AiOutlineDashboard, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { IoIosCloseCircleOutline, IoMdClose, IoMdEye } from "react-icons/io";
import { SiNextdotjs } from "react-icons/si";
import { IoImagesOutline, IoSettingsOutline } from "react-icons/io5";
import { AudioWaveform, BadgeCheck, Bell, BookOpen, Bot, CheckIcon, ChevronDownIcon, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUpIcon, CircleIcon, Command, CreditCard, Folder, Forward, Frame, GalleryVerticalEnd, LogOut, MinusIcon, MoreHorizontal, PanelLeftIcon, PanelRightIcon, PieChart, Plus, Settings2, Sparkles, SquareTerminal, Trash2 } from 'lucide-react';
import { LuArrowUpDown, LuCirclePlus } from "react-icons/lu";
import { FiEdit, FiMoreVertical } from "react-icons/fi";
import { BiSearchAlt2 } from "react-icons/bi";
import { HiOutlineCalendar } from "react-icons/hi";
import { RiLoader2Line } from "react-icons/ri";
import { BsPersonPlusFill } from 'react-icons/bs';
import { TbReceiptTax } from "react-icons/tb";

export const CheckCircleIcon = FaCheckCircle;
export const ViewIcon = AiOutlineEye;
export const HideIcon = AiOutlineEyeInvisible;
export const CancelIcon = MdCancel;
export const SpinnerIcon = FaSpinner;
export const RegCircleIcon = FaRegCircle;
export const ChevronRightIcon = ChevronRight;
export const ChevronLeftIcon = ChevronLeft;
export const PanelLeft = PanelLeftIcon;
export const UpIcon = ChevronUpIcon;
export const DownIcon = ChevronDownIcon;
export const Check = CheckIcon;
export const AudioWaveformIcon = AudioWaveform;
export const BookOpenIcon = BookOpen;
export const BotIcon = Bot;
export const CommandIcon = Command;
export const FrameIcon = Frame;
export const GalleryVerticalEndIcon = GalleryVerticalEnd;
export const MapIcon = Map;
export const PanelRight = PanelRightIcon;
export const PieChartIcon = PieChart;
export const SettingsIcon = Settings2;
export const SquareTerminalIcon = SquareTerminal;
export const FolderIcon = Folder;
export const ForwardIcon = Forward;
export const MoreHorizontalIcon = MoreHorizontal;
export const TrashIcon = Trash2;
export const BadgeCheckIcon = BadgeCheck;
export const BellIcon = Bell;
export const ChevronsUpDownIcon = ChevronsUpDown;
export const CreditCardIcon = CreditCard;
export const LogOutIcon = LogOut;
export const SparklesIcon = Sparkles;
export const PlusIcon = Plus;
export const Minus = MinusIcon;
export const Circle = CircleIcon;
export const CloseIcon = IoMdClose;
export const NextJsIcon = SiNextdotjs;
export const SettingIcon = IoSettingsOutline;
export const DashboardIcon = AiOutlineDashboard;
export const InventoryIcon = MdOutlineInventory2;
export const SalesIcon = FaSalesforce;
export const ArrowUpDownIcon = LuArrowUpDown;
export const MoreIcon = FiMoreVertical;
export const DeleteIcon = MdDelete;
export const InfoIcon = FaInfo;
export const SearchIcon = BiSearchAlt2;
export const CalendarIcon = HiOutlineCalendar;
export const EditIcon = FiEdit;
export const RoundCloseIcon = IoIosCloseCircleOutline;
export const LoaderIcon = RiLoader2Line;
export const LeftIcon = FaChevronLeft;
export const RightIcon = FaChevronRight;
export const CirclePlusIcon = LuCirclePlus;
export const ArrowRightIcon = FaArrowRight;
export const ImageIcon = FaImage;
export const MutipleImageIcon = IoImagesOutline;
export const EyeIcon = IoMdEye;
export const PersonPlusIcon = BsPersonPlusFill;
export const TagIcon = FaTag;
export const TaxIcon = TbReceiptTax;

export const ImagePlusIcon = ({ className = "" }: { className?: string }) => (
  <svg 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 48 48" 
    aria-hidden="true"
    className={className}
  >
    <path
      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);