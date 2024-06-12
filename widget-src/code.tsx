const { widget } = figma;

const { AutoLayout, Input, Text, useSyncedState, useEffect } = widget;

// async function loadFonts() {
//   await figma.loadFontAsync({ family: "Inter", style: "Medium" });
// }

// Fonction pour créer une table à partir de la chaîne DBML
function createTable(tableName: string) {
  // Check if a table with the same name already exists
  const existingTable = figma.currentPage.findChild(
    (node) => node.name === tableName && node.type === "FRAME"
  );

  let table;
  if (existingTable) {
    table = existingTable as FrameNode;
  } else {
    // Create a new AutoLayout frame for the table
    table = figma.createFrame();
    table.name = tableName;
    table.layoutMode = "VERTICAL";
    table.primaryAxisSizingMode = "AUTO";
    table.counterAxisSizingMode = "AUTO";
    table.itemSpacing = 0;
    table.paddingTop = 10;
    table.paddingBottom = 10;
    table.paddingLeft = 10;
    table.paddingRight = 10;
    table.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    table.strokes = [{ type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.85 } }];

    // Create title
    const titleText = figma.createText();
    titleText.characters = tableName;
    titleText.fontSize = 20;
    titleText.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];

    //titleFrame
    const titleFrame = figma.createFrame();
    titleFrame.layoutMode = "HORIZONTAL";
    titleFrame.primaryAxisSizingMode = "AUTO";
    titleFrame.counterAxisSizingMode = "AUTO";
    titleFrame.name = tableName;
    titleFrame.itemSpacing = 0;
    titleFrame.paddingTop = 12;
    titleFrame.paddingBottom = 12;
    titleFrame.paddingLeft = 20;
    titleFrame.paddingRight = 20;

    titleFrame.appendChild(titleText);

    table.appendChild(titleFrame);
    table.x = figma.viewport.center.x;
    table.y = figma.viewport.center.y;
    figma.currentPage.appendChild(table);
  }

  // Update title if it already exists
  const existingTitle = table.findOne(
    (node) => node.type === "TEXT" && node.name === tableName
  );
  if (existingTitle && existingTitle.type === "TEXT") {
    existingTitle.characters = tableName;
  }

  return table;
}

function createRow(name: string, type: string, table: FrameNode) {
  // Create a new AutoLayout frame for each row
  const rowFrame = figma.createFrame();
  rowFrame.layoutMode = "HORIZONTAL";
  rowFrame.layoutAlign = "STRETCH";
  rowFrame.primaryAxisSizingMode = "FIXED";
  rowFrame.counterAxisSizingMode = "AUTO";
  rowFrame.itemSpacing = 0;
  rowFrame.paddingTop = 12;
  rowFrame.paddingBottom = 12;
  rowFrame.paddingLeft = 20;
  rowFrame.paddingRight = 20;
  // rowFrame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 0.5 } }];
  rowFrame.strokes = [{ type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.85 } }];
  rowFrame.strokeTopWeight = 1;
  rowFrame.primaryAxisAlignItems = "SPACE_BETWEEN";

  // Add the name
  const nameText = figma.createText();
  nameText.characters = name;
  nameText.fontSize = 16;
  nameText.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];

  //nameFrame
  const nameFrame = figma.createFrame();
  nameFrame.layoutMode = "HORIZONTAL";
  nameFrame.primaryAxisSizingMode = "AUTO";
  nameFrame.counterAxisSizingMode = "AUTO";
  nameFrame.itemSpacing = 0;
  nameFrame.paddingRight = 60;

  nameFrame.appendChild(nameText);
  rowFrame.appendChild(nameFrame);

  // Add the type
  const typeText = figma.createText();
  typeText.textAlignHorizontal = "RIGHT";
  typeText.characters = type;
  typeText.fontSize = 16;
  typeText.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];

  //typeFrame
  const typeFrame = figma.createFrame();
  typeFrame.layoutMode = "HORIZONTAL";
  typeFrame.primaryAxisSizingMode = "AUTO";
  typeFrame.counterAxisSizingMode = "AUTO";
  typeFrame.itemSpacing = 0;

  typeFrame.appendChild(typeText);
  rowFrame.appendChild(typeFrame);

  table.appendChild(rowFrame);
}

function createTableFromDBML(dbml: string) {
  // Split the input by recognizing the start of a new table definition
  const tableDefinitions = dbml.split(/Table\s+/).filter(Boolean);

  // Iterate over each table definition
  tableDefinitions.forEach((tableDefinition) => {
    // Extract the table name and rows from the DBML schema
    const tableMatch = tableDefinition.match(/(\w+)\s+\{([^}]+)\}/);
    if (!tableMatch) return;

    const [, tableName, rowsText] = tableMatch;
    const rows = rowsText
      .trim()
      .split("\n")
      .map((row) => row.trim())
      .filter((row) => row);

    const table = createTable(tableName);

    // Remove existing rows from the table
    table.children.forEach((child) => {
      if (child.name !== tableName) {
        child.remove();
      }
    });

    // Add or update rows
    rows.forEach((row) => {
      const [name, type] = row.split(" ").filter((token) => token);
      createRow(name, type, table);
    });
    console.log(table.children);
  });
}

function Widget() {
  // Utilisez un état synchronisé pour suivre l'action de création du rectangle
  const [createRectangle, setCreateRectangle] = useSyncedState(
    "createRectangle",
    false
  );

  const [text, setText] = useSyncedState("text", "");

  // Utilisation de l'effet pour créer le rectangle lorsque l'état change
  useEffect(() => {
    if (createRectangle) {
      createTableFromDBML(text);
      setCreateRectangle(false); // Réinitialiser l'état après la création du rectangle
    }
  }, [createRectangle]);

  // Rendu de l'interface du widget
  return (
    <AutoLayout
      direction="vertical"
      spacing={20}
      padding={16}
      horizontalAlignItems="center"
      fill="#ffffff"
      stroke="#dcdcdc"
      overflow="scroll"
      minHeight={200}
    >
      <Input
        value={text}
        placeholder="Enter DBML"
        onTextEditEnd={(e) => {
          setText(e.characters);
        }}
        fill="#000000"
        width={500}
        inputFrameProps={{
          fill: "#efefef",
          stroke: "#dcdcdc",
          cornerRadius: 8,
          padding: 20,
        }}
        inputBehavior="multiline"
      />
      <Text fontSize={16} onClick={() => setCreateRectangle(true)}>
        Save
      </Text>
    </AutoLayout>
  );
}

// Enregistrement du widget
widget.register(Widget);
