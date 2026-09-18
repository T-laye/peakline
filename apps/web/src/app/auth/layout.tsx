import { AuthLayout } from "@/components/layouts/AuthLayout";

export default function Layout({ children }: LayoutProps<"/auth">) {
	return <AuthLayout>{children}</AuthLayout>;
}
