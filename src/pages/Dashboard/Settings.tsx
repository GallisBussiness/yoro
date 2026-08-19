import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { FaCog, FaRuler, FaTags } from 'react-icons/fa';
import { Tabs, Text, Divider } from '@mantine/core';
import { Card } from '../../components/shadcn/card';
import Unites from './Unites';
import Familles from './Familles';
import Parametres from './Params/Parametres';

const Settings = () => {
  return (
    <div className="mx-auto p-4">
      <Breadcrumb pageName="Paramétrage" />

      <Card className="mb-4 p-4 md:p-5 shadow-md">
        <div className="mb-4">
          <Text fw={600} size="lg" className="text-foreground flex items-center gap-2">
            <FaCog className="text-primary" /> Configuration du système
          </Text>
          <Text size="sm" className="mt-1 text-muted-foreground">
            Gérez les paramètres de votre entreprise, les unités de mesure et les familles d'articles
          </Text>
          <Divider className="my-3" />
        </div>

        <Tabs
          defaultValue="parametres"
          variant="pills"
          styles={{
            root: { width: '100%' },
            list: { marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.25rem' },
            tab: { fontWeight: 500, transition: 'all 0.2s' },
            panel: { paddingTop: '1rem' },
          }}
          classNames={{
            tab: 'font-medium transition-all duration-200 text-muted-foreground hover:text-foreground',
          }}
        >
          <Tabs.List>
            <Tabs.Tab
              value="parametres"
              leftSection={<FaCog className="text-primary" />}
              className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
            >
              Paramètres
            </Tabs.Tab>
            <Tabs.Tab
              value="unites"
              leftSection={<FaRuler className="text-primary" />}
              className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
            >
              Unités
            </Tabs.Tab>
            <Tabs.Tab
              value="familles"
              leftSection={<FaTags className="text-primary" />}
              className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
            >
              Familles
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="parametres">
            <Parametres />
          </Tabs.Panel>

          <Tabs.Panel value="unites">
            <Unites />
          </Tabs.Panel>

          <Tabs.Panel value="familles">
            <Familles />
          </Tabs.Panel>
        </Tabs>
      </Card>
    </div>
  );
};

export default Settings;
