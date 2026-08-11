import { Alert, Container, Loader, Stack, Text, Title } from '@mantine/core';

import { useGetHealth } from './api/generated/client';
import type { AppComponent } from './App.contract';

import classes from './App.module.css';

export const App: AppComponent = () => {
  const health = useGetHealth();

  return (
    <Container className={classes.container} size="sm">
      <Stack gap="md">
        <Title order={1}>Технический фундамент</Title>
        <Text c="dimmed">Продуктовые экраны и функции пока не реализованы.</Text>
        {health.isPending ? <Loader aria-label="Проверка API" /> : null}
        {health.isSuccess ? <Alert color="green">API и SQLite готовы.</Alert> : null}
        {health.isError ? <Alert color="red">API недоступен.</Alert> : null}
      </Stack>
    </Container>
  );
};
