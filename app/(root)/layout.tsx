import Image from 'next/image'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const loggedIn = { firstName: 'Misee', lastName: 'Nwafor' }

  return (
    <main className="flex h-screen w-full font-inter">
      <Sidebar user={loggedIn} />
      <div className="flex size-full flex-col">
        <div className="root-layout">
          <Image src="/icons/logo.svg" width={30} height={30} alt="logo" />
          <div>
            <MobileNav user={loggedIn} />
          </div>
        </div>
        {children}
      </div>
    </main>
  )
}
