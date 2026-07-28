/** shared/ui 公开边界：零业务语义的基础组件，仅消费语义令牌（基线 §10） */
export {
  AudioPlayer,
  audioPlayerVariants,
  type AudioPlayerProps,
} from "./AudioPlayer";
export { Badge, badgeVariants, type BadgeProps } from "./Badge";
export { Button, buttonVariants, type ButtonProps } from "./Button";
export { Card, cardVariants, type CardProps } from "./Card";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  type DialogContentProps,
  type DialogDescriptionProps,
  type DialogFooterProps,
  type DialogHeaderProps,
  type DialogOverlayProps,
  type DialogTitleProps,
} from "./Dialog";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export { Input, type InputProps } from "./Input";
export { Separator, type SeparatorProps } from "./Separator";
export { Skeleton, type SkeletonProps } from "./Skeleton";
export {
  StatusCapsule,
  statusCapsuleVariants,
  statusCapsuleDotVariants,
  type StatusCapsuleProps,
} from "./StatusCapsule";
export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type TabsContentProps,
  type TabsListProps,
  type TabsTriggerProps,
} from "./Tabs";
export { Tag, type TagProps } from "./Tag";
export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type TooltipContentProps,
} from "./Tooltip";
export * from "./icon";
