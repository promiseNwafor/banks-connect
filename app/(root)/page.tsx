import TotalBalanceBox from '@/components/TotalBalanceBox'
import HeaderBox from '@/components/HeaderBox'
import RightSidebar from '@/components/RightSidebar'

const Home = async ({ searchParams: { id, page } }: SearchParamProps) => {
  const loggedIn = {
    firstName: 'Misee',
    lastName: 'Nwafor',
    email: 'misee@gmail.com',
  }

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={loggedIn?.firstName || 'Guest'}
            subtext="Access and manage your account and transactions efficiently."
          />
          <TotalBalanceBox accounts={[]} totalBanks={1} totalCurrentBalance={1250.35} />
        </header>
      </div>
      <RightSidebar user={loggedIn} transactions={[]} banks={[]} />
    </section>
  )
}

export default Home
