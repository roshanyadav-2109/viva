-- Run after schema.sql and after the workbook import.
-- The primary key makes this one record per normalized question and subject;
-- repeated question rows automatically reuse the same guidance in search_questions.
with seed(subject, question, answer, demo, tips) as (values
  ('MAD1', 'What is Vue.js?',
   'Vue.js is a progressive JavaScript framework for building user interfaces. It uses declarative rendering and reactive state, so the UI updates when the underlying data changes. In my project I used components, props, events, and routing to keep the interface maintainable.',
   'Run the project, open a component, and change a reactive value such as a counter or form field. Show that the template updates without manually changing the DOM. Point out the component, its state, and the rendered result.',
   'Define it first, then connect it to your own code. Be ready to explain why you chose Vue over plain DOM manipulation and where component boundaries are.'),
  ('MAD1', 'What is the difference between Vue and Vuex?',
   'Vue is the UI framework; Vuex is a centralized state-management library used by Vue applications. Local component state belongs in the component, while shared state such as the logged-in user or cart belongs in a store. For newer Vue projects, Pinia is commonly preferred, but the separation principle is the same.',
   'Open two components that need the same value. Show the value being read from the store and updated through an action or mutation, then refresh the second component to demonstrate shared state.',
   'Do not say Vuex renders the UI. Explain state ownership, one-way data flow, and when a store would be unnecessary overhead.'),
  ('MAD2', 'What are Vue lifecycle hooks, and which ones did you use?',
   'Lifecycle hooks run at defined stages of a component lifecycle. I used onMounted for initial data loading and onUnmounted for cleanup such as removing listeners or stopping timers. The hook should match the resource or side effect being managed.',
   'Add a console log or network request in onMounted, refresh the page, and show the request in the browser network panel. Add cleanup in onUnmounted and explain what leak it prevents.',
   'Name only hooks you can justify from your project. Mention that hooks must be called in the component setup context and avoid putting pure calculations inside lifecycle hooks.'),
  ('MAD2', 'Explain how watch works in Vue and where you used it.',
   'watch observes a reactive source and runs a callback when that source changes. I used it for side effects such as refetching filtered data or syncing a query parameter; computed is better when the goal is only to derive another value.',
   'Change a search field, show the watched value in the console, and then show the resulting request. Explain debounce if the watcher triggers an API call.',
   'Clearly distinguish watch, computed, and watchEffect. Mention cleanup for async work and avoid watching large objects deeply unless it is necessary.'),
  ('PYTHON', 'What is a list comprehension?',
   'A list comprehension is compact Python syntax for creating a list from an iterable, optionally applying a condition. It is equivalent to a readable loop for simple transformations, but a normal loop is clearer when the logic becomes complex.',
   'Show `[x * x for x in range(5) if x % 2 == 0]`, print the result, and rewrite it as a for loop so the equivalence is clear.',
   'Explain the input, transformation, and filter separately. Do not use nested comprehensions when they reduce readability.'),
  ('MLP', 'What feature engineering techniques did you use?',
   'Feature engineering converts raw data into useful model inputs. I handled missing values, encoded categorical values, scaled numeric features where the model required it, and selected or derived features based on domain understanding and validation results. Every transformation was fitted on training data to avoid leakage.',
   'Take one raw column from the project dataset and show its before-and-after representation in the preprocessing pipeline. Then run the model with and without the transformation and compare the validation metric.',
   'Explain why each transformation was used, not just its name. Call out data leakage, reproducibility, and keeping preprocessing identical in training and inference.'),
  ('MLP', 'Which correlation method did you use?',
   'I selected the correlation method based on the data: Pearson measures linear association for continuous variables, while Spearman measures monotonic association using ranks and is less sensitive to outliers. Correlation is useful for exploration but does not prove causation.',
   'Plot a heatmap for the selected numeric features and inspect one strong and one weak relationship. Show the code and explain how the result influenced feature selection without relying on correlation alone.',
   'State the assumptions, check outliers, and mention that correlation with the target must be evaluated on training data only.'),
  ('MAD2', 'What is normalization?',
   'Normalization organizes relational data to reduce redundancy and update anomalies. In practice, I split repeated data into related tables, used primary and foreign keys, and aimed for a suitable normal form while considering query performance and justified denormalization.',
   'Show a small unnormalized table with repeated customer data, split it into Customer and Order tables, and run a JOIN to produce the original view.',
   'Explain the anomaly being prevented: insert, update, or delete. Do not recite normal-form names without showing the dependency they address.'),
  ('MAD2', 'What is the difference between a primary key and a foreign key?',
   'A primary key uniquely identifies a row and cannot be null. A foreign key references a key in another table and enforces the relationship between rows. The foreign key may repeat because many child rows can belong to one parent.',
   'Show Customer(id) and Order(customer_id), insert a valid order, then try an unknown customer_id and show the database rejecting it because of referential integrity.',
   'Mention uniqueness, nullability, and referential actions such as restrict or cascade. Use the schema from your own project when answering.'),
  ('MAD2', 'What is a JOIN?',
   'A JOIN combines rows from related tables using a matching condition. INNER JOIN returns matching rows only; LEFT JOIN keeps every row from the left table and adds matching values when available. The choice depends on whether unmatched rows matter.',
   'Run an INNER JOIN between a parent and child table, then change it to LEFT JOIN and add a parent with no child row to show the difference in output.',
   'State the join type and the relationship cardinality. Check for accidental duplicate rows and explain which columns are indexed for the query.'),
  ('PYTHON', 'What is the difference between a list and a tuple?',
   'A list is mutable and is suited to a collection that changes. A tuple is immutable and communicates fixed structure; it can also be used as a dictionary key when its elements are hashable. Both preserve order and allow duplicate values.',
   'Create one list and one tuple, mutate the list, and show that assigning to a tuple element raises TypeError. Use a tuple for a fixed coordinate or record-like value.',
   'Focus on mutability and intent rather than claiming tuples are always faster. Choose the type based on whether the data should change.'),
  ('MAD1', 'What is REST API?',
   'A REST API exposes resources through stateless HTTP requests. It uses meaningful URLs, HTTP methods such as GET, POST, PUT/PATCH, and DELETE, appropriate status codes, and a consistent representation such as JSON.',
   'Open the browser network panel or Postman, send a GET request, create a record with POST, and show the response status, payload, and validation error for an invalid request.',
   'Explain authentication, validation, error handling, and idempotency. Do not call every JSON endpoint REST without discussing resource-oriented design.')
)
insert into public.question_guidance (subject, qkey, question, answer, demo, tips)
select s.code, lower(private.qclean(seed.question)), seed.question, seed.answer, seed.demo, seed.tips
from seed
join public.subjects s on s.code = seed.subject
on conflict (subject, qkey) do update set
  question = excluded.question,
  answer = excluded.answer,
  demo = excluded.demo,
  tips = excluded.tips,
  updated_at = now();
