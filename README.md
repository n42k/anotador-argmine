# Anotador ArgMine

## Controlos

A aplicação é controlada com o rato e o teclado.
Selecionando texto e carregando com o botão esquerdo do rato no canvas, é criada uma proposição.
Com a tecla SHIFT pressionada, carregando numa proposição e arrastando para outra, temos a primeira proposição a suportar a segunda.
Ainda é possível carregar com o botão direito do rato numa proposição para a editar ou apagar, ou numa linha para a apagar.

## Argumentos

Todos os argumentos são passados por parâmetros no URL (ver exemplos).
Os seguintes campos estão disponíveis:

Parâmetro | Valor por defeito    | Descrição
--------- | -------------------- | ---------
url       | Nenhum               | O URL de onde carregar a notícia. Deverá acabar em um número.html (por exemplo, 1.html), de forma a carregar o id da notícia.
proxy     | `https://cors.io/?`  | O URL da proxy CORS a usar. Isto permite carregar URLs de outros domínios. Definir como `''` se o URL for relativo ao domínio atual.
results   | `results.php`        | O URL onde o JSON resultante será submetido.
load      | Nenhum               | O URL donde o JSON será carregado.
exit      | `../annotations.php` | O URL onde o utilizador é redirecionado depois de sair.


## Exemplos

http://n42k.github.io/anotador-argmine?url=examples/1.html&proxy=