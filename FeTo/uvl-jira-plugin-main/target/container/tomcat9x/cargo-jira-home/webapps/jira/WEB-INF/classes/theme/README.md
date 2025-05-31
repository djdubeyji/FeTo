  This package aims to deliver common color definitions that are ADGS-compatible.

  Check out the design spec.

  ## Consumed via P2 plugin

  You can import the following LESS file with color variables in your LESS file:

  ~~~
  @import 'webstatic:/ui/imports/colours';
  ~~~

  #### Jira LookAndFeel colors

  Use the following import in your LESS file when you need a color
  which can be customised on the Jira instance using LookAndFeel feature.

  ~~~
  @import 'webstatic:/ui/imports/theme';
  ~~~

  When importing this Look&Feel module make sure that your LESS file is declared
  inside `<lookandfeel-webresource>` element in your `atlassian-plugin.xml`.

  ## Consumed via npm package

  You can import the following LESS file with color variables:

  ~~~
  @import '~@atlassian/jira-theme/dist/jira-colors';
  ~~~

  #### Jira LookAndFeel colors

  Due to the dynamic nature of LookAndFeel feature those colors cannot be
  defined statically.

  ## Under consideration

  Give us know if you'd like to have a possibility to use Jira colors:

  * as JS variables, e.g. in styled React components,
  * as CSS variables, e.g. when using post-css.