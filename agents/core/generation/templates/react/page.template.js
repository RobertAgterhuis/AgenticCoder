/**
 * React Page Template
 * 
 * Generates a page component with:
 * - React Router integration
 * - Data fetching patterns
 * - Loading/error states
 */

const template = `import React, { useState, useEffect } from 'react';
import { useParams, useNavigate{{#if hasSearchParams}}, useSearchParams{{/if}} } from 'react-router-dom';
{{#each imports}}
import {{#if this.default}}{{this.default}}{{else}}{ {{join this.named}} }{{/if}} from '{{this.from}}';
{{/each}}
{{#if hasStyles}}
import styles from './{{pageName}}Page.module.css';
{{/if}}

{{#if hasTypes}}
interface {{pageName}}PageParams {
{{#each params}}
  {{this.name}}: {{this.type}};
{{/each}}
}
{{/if}}

{{#if description}}/**
 * {{description}}
 */
{{/if}}export function {{pageName}}Page() {
  const params = useParams{{#if hasTypes}}<{{pageName}}PageParams>{{/if}}();
  const navigate = useNavigate();
{{#if hasSearchParams}}
  const [searchParams, setSearchParams] = useSearchParams();
{{/if}}

{{#if hasData}}
  const [data, setData] = useState<{{dataType}} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        {{fetchLogic}}
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [{{join fetchDeps}}]);

  if (loading) {
    return (
      <div className="page-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error">
        <h2>Error</h2>
        <p>{error.message}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

{{/if}}{{#if customLogic}}
  {{customLogic}}

{{/if}}  return (
    <div className="page {{pageClassName}}{{#if hasStyles}} {styles.page}{{/if}}">
      {{#if showHeader}}
      <header className="page-header">
        <h1>{{pageTitle}}</h1>
        {{#if showBreadcrumb}}
        <nav className="breadcrumb">
          {{breadcrumb}}
        </nav>
        {{/if}}
      </header>
      {{/if}}

      <main className="page-content">
        {{pageContent}}
      </main>

      {{#if showFooter}}
      <footer className="page-footer">
        {{footerContent}}
      </footer>
      {{/if}}
    </div>
  );
}

export default {{pageName}}Page;
`;

/**
 * Default page content
 */
const defaultContent = `<p>{{pageName}} page content</p>`;

/**
 * Prepare variables for page generation
 */
function prepareVariables(config) {
  return {
    pageName: config.name,
    description: config.description || '',
    pageTitle: config.title || config.name,
    pageClassName: config.className || config.name.toLowerCase(),
    pageContent: config.content || defaultContent,
    hasStyles: config.useStyles !== false,
    hasTypes: !!(config.params && config.params.length > 0),
    hasSearchParams: config.useSearchParams || false,
    hasData: !!config.dataFetching,
    dataType: config.dataType || 'any',
    fetchLogic: config.fetchLogic || 'const result = await fetch(\'/api/data\').then(r => r.json());',
    fetchDeps: config.fetchDeps || ['params'],
    showHeader: config.showHeader !== false,
    showFooter: config.showFooter || false,
    showBreadcrumb: config.showBreadcrumb || false,
    breadcrumb: config.breadcrumb || '',
    footerContent: config.footerContent || '',
    customLogic: config.customLogic || '',
    params: config.params || [],
    imports: config.imports || []
  };
}

module.exports = {
  template,
  defaultContent,
  prepareVariables
};
