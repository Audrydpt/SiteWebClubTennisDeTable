# ACIC React

Ce projet est une application web moderne construite avec React, utilisant une architecture modulaire basée sur les fonctionnalités.

## Structure:

Le projet suit une architecture modulaire basée sur les fonctionnalités.

```
src/
|-- assets/                             # Ressources statiques
|-- components/                         # Composants réutilisables
|   |-- ui/                             # Composants ShadCN
|-- features/                           # Modules fonctionnels de l'application
|   |-- exemple/                        # Exemple de module
|   |   |-- components/                 # Composants réservé au module
|   |   |-- hooks/                      # Hook réservé au module
|   |   |-- lib/                        # Utilitaires et fonctions du module
|-- hooks/                              # Hooks React personnalisés
|-- lib/                                # Utilitaires et fonctions partagées
|-- providers/                          # Providers React (contexte, thème, etc.)
```

## Stack technique

### Frontend

- vite
- react (18)
- typescript
- tailwind
- shadcn
- eslint (airbnb + airbnb-typescript + react-hooks + react-refresh)
- prettier
- @tanstack/query

### Backend

- python3
- sqlalchemy/pgsql
- alembic
- fastapi

## Recommanded extensions:

- bradlc.vscode-tailwindcss
- YoavBls.pretty-ts-errors
- meganrogge.template-string-converter
- dbaeumer.vscode-eslint
- esbenp.prettier-vscode
- ms-python.vscode-pylance
- donjayamanne.python-environment-manager

## readme plz:

- https://openclassrooms.com/fr/courses/7008001-debutez-avec-react (component & props)
- https://openclassrooms.com/fr/courses/7150606-creez-une-application-react-complete (state)
- https://www.youtube.com/watch?v=38wJmjeJNAk (react-query)
- https://medium.com/design-bootcamp/dos-and-don-t-for-ui-design-7e5c86c71cac (ux/ui do's and don't) ([part 1](https://medium.com/design-bootcamp/dos-and-don-t-for-ui-design-7e5c86c71cac), [part 2,](https://medium.com/design-bootcamp/dos-and-don-t-for-ui-design-part-2-8f56dcd66b4) [part 3](https://medium.com/design-bootcamp/dos-and-don-t-for-ui-design-part-3-72857318ff0c), [part 4](https://medium.com/design-bootcamp/dos-and-don-t-for-ui-design-part-4-15a90b8009b5))
- https://medium.com/design-bootcamp/data-visualization-and-dashboard-design-case-study-c639da21e4c9 (ux/ui data visualization)
- https://www.belgif.be/specification/rest/api-guide/ (rest api)
- https://www.uidesign.tips (ui/ux)
