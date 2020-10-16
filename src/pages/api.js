import React from 'react';
import Layout from '@theme/Layout';
import Redocusaurus from '../components/Redocusaurus';

function APIDocs() {
  return (
  <Layout
    title={`API Docs`}
    description={`Open API Reference Docs for the API`}
  >
    <Redocusaurus spec="https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/yaml/petstore.yaml" />
  </Layout>
  );
}

export default APIDocs;