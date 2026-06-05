create table public.skill_taxonomy (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  category     text not null check (category in ('Backend', 'Frontend', 'DevOps', 'Data', 'Mobile', 'Security', 'AI/ML', 'Other')),
  subcategory  text,
  aliases      text[] default '{}',
  description  text,
  created_at   timestamptz default now()
);

alter table public.skill_taxonomy enable row level security;
create policy "anyone can read taxonomy" on public.skill_taxonomy for select using (true);
create policy "admins can manage taxonomy" on public.skill_taxonomy for all using (
  exists (select 1 from public.profiles where id::text = auth.uid()::text and role = 'admin')
);

alter table public.skills add column if not exists taxonomy_id uuid references public.skill_taxonomy(id) on delete set null;

-- Backend
insert into public.skill_taxonomy (name, category, subcategory, aliases) values
  ('Go',           'Backend', 'Languages',  '{"Golang"}'),
  ('Python',       'Backend', 'Languages',  '{"py", "Python3"}'),
  ('Java',         'Backend', 'Languages',  '{"Java 17", "Java 11"}'),
  ('Node.js',      'Backend', 'Languages',  '{"NodeJS", "Node"}'),
  ('Rust',         'Backend', 'Languages',  '{}'),
  ('PostgreSQL',   'Backend', 'Databases',  '{"Postgres", "psql"}'),
  ('MySQL',        'Backend', 'Databases',  '{}'),
  ('Redis',        'Backend', 'Databases',  '{}'),
  ('MongoDB',      'Backend', 'Databases',  '{"Mongo"}'),
  ('GraphQL',      'Backend', 'APIs',       '{}'),
  ('REST APIs',    'Backend', 'APIs',       '{"RESTful APIs", "REST"}'),
  ('gRPC',         'Backend', 'APIs',       '{}'),
  ('Kafka',        'Backend', 'Messaging',  '{"Apache Kafka"}'),
  ('RabbitMQ',     'Backend', 'Messaging',  '{}'),
  ('Elasticsearch','Backend', 'Search',     '{"ES", "Elastic"}'),
  ('Microservices','Backend', 'Architecture','{}'),
  ('System Design','Backend', 'Architecture','{}');

-- Frontend
insert into public.skill_taxonomy (name, category, subcategory, aliases) values
  ('React',        'Frontend', 'Frameworks', '{"ReactJS", "React.js", "React 18"}'),
  ('Next.js',      'Frontend', 'Frameworks', '{"NextJS", "Next"}'),
  ('TypeScript',   'Frontend', 'Languages',  '{"TS"}'),
  ('JavaScript',   'Frontend', 'Languages',  '{"JS", "ES6"}'),
  ('Vue.js',       'Frontend', 'Frameworks', '{"Vue", "VueJS"}'),
  ('Angular',      'Frontend', 'Frameworks', '{}'),
  ('Tailwind CSS', 'Frontend', 'Styling',    '{"Tailwind"}'),
  ('CSS',          'Frontend', 'Styling',    '{"CSS3"}'),
  ('HTML',         'Frontend', 'Markup',     '{"HTML5"}'),
  ('Figma',        'Frontend', 'Design',     '{}'),
  ('Web Performance','Frontend','Optimization','{"Core Web Vitals"}');

-- Mobile
insert into public.skill_taxonomy (name, category, subcategory, aliases) values
  ('React Native', 'Mobile', 'Frameworks', '{"RN"}');

-- DevOps
insert into public.skill_taxonomy (name, category, subcategory, aliases) values
  ('Kubernetes',   'DevOps', 'Orchestration', '{"K8s"}'),
  ('Docker',       'DevOps', 'Containers',    '{}'),
  ('AWS',          'DevOps', 'Cloud',         '{"Amazon Web Services"}'),
  ('GCP',          'DevOps', 'Cloud',         '{"Google Cloud"}'),
  ('Azure',        'DevOps', 'Cloud',         '{"Microsoft Azure"}'),
  ('Terraform',    'DevOps', 'IaC',           '{}'),
  ('Ansible',      'DevOps', 'IaC',           '{}'),
  ('CI/CD',        'DevOps', 'Automation',    '{"GitHub Actions", "Jenkins"}'),
  ('Linux',        'DevOps', 'Systems',       '{"Unix"}'),
  ('Prometheus',   'DevOps', 'Monitoring',    '{}'),
  ('Grafana',      'DevOps', 'Monitoring',    '{}'),
  ('Nginx',        'DevOps', 'Networking',    '{}');

-- Data (Python renamed to 'Python for Data' to avoid duplicate with Backend Python)
insert into public.skill_taxonomy (name, category, subcategory, aliases) values
  ('Apache Spark',  'Data', 'Processing',    '{"Spark", "PySpark"}'),
  ('Apache Airflow','Data', 'Orchestration', '{"Airflow"}'),
  ('dbt',           'Data', 'Transformation','{"data build tool"}'),
  ('SQL',           'Data', 'Languages',     '{"BigQuery SQL", "Snowflake SQL"}'),
  ('Python for Data','Data','Languages',     '{"pandas", "numpy", "PySpark"}'),
  ('Snowflake',     'Data', 'Warehouses',    '{}'),
  ('BigQuery',      'Data', 'Warehouses',    '{}'),
  ('Redshift',      'Data', 'Warehouses',    '{"AWS Redshift"}'),
  ('Power BI',      'Data', 'Visualization', '{}'),
  ('Tableau',       'Data', 'Visualization', '{}'),
  ('Data Modeling', 'Data', 'Architecture',  '{}'),
  ('ETL/ELT',       'Data', 'Pipelines',     '{"ETL", "ELT"}');

-- AI/ML
insert into public.skill_taxonomy (name, category, subcategory, aliases) values
  ('Machine Learning','AI/ML','Core',          '{"ML"}'),
  ('PyTorch',         'AI/ML','Frameworks',    '{}'),
  ('TensorFlow',      'AI/ML','Frameworks',    '{}'),
  ('LLMs',            'AI/ML','GenAI',         '{"Large Language Models"}'),
  ('RAG',             'AI/ML','GenAI',         '{"Retrieval Augmented Generation"}'),
  ('MLOps',           'AI/ML','Operations',    '{}'),
  ('Computer Vision', 'AI/ML','Specialization','{"CV"}'),
  ('NLP',             'AI/ML','Specialization','{"Natural Language Processing"}');

-- Security
insert into public.skill_taxonomy (name, category, subcategory, aliases) values
  ('Application Security','Security','AppSec',      '{"AppSec"}'),
  ('Penetration Testing', 'Security','Testing',     '{"PenTesting", "Pentest"}'),
  ('Zero Trust',          'Security','Architecture','{}'),
  ('IAM',                 'Security','Identity',    '{"Identity & Access Management"}'),
  ('SIEM',                'Security','Monitoring',  '{}');
