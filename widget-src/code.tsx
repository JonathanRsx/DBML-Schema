const { widget } = figma;
const { AutoLayout, Input, Image, Text, useSyncedState, useEffect } = widget;

// async function loadFonts() {
//   await figma.loadFontAsync({ family: "Inter", style: "Medium" });
// }
interface Row {
  name: string;
  type: string;
  isPrimaryKey: boolean;
}

interface Relation {
  fromTable: string;
  fromColumn: string;
  direction: string;
  toTable: string;
  toColumn: string;
}

function parseDBML(dbml: string): {
  tables: { [key: string]: Row[] };
  relations: Relation[];
} {
  const tableRegex = /Table\s+(\w+)\s+\{([^}]+)\}/g;
  const relationRegex1 =
    /(\w+)\s+\w+\s+\[ref:\s+([<>-]{1,2})\s*(\w+)\.(\w+)\]/g; // Format: [ref: < TableName.ColumnName]
  const relationRegex2 =
    /Ref:\s+"([^"]+)"\."([^"]+)"\s+([<>-]{1,2})\s+"([^"]+)"\."([^"]+)"/g; // Format: Ref: "TableName1"."ColumnName1" < "TableName2"."ColumnName2"

  const tables: { [key: string]: Row[] } = {};
  const relationsSet: Set<string> = new Set(); // Set to store unique relations

  let tableMatch;
  while ((tableMatch = tableRegex.exec(dbml)) !== null) {
    const [, tableName, rowsText] = tableMatch;
    const rows = rowsText
      .trim()
      .split("\n")
      .map((row) => row.trim())
      .filter((row) => row);

    //tables[tableName] = rows;
    tables[tableName] = rows.map((row) => {
      const [name, type, ...attributes] = row.split(/\s+/);
      const isPrimaryKey = attributes.some(
        (attr) =>
          attr.toLowerCase() === "[pk]" ||
          attr.toLowerCase() === "[primary key]"
      );
      return { name, type, isPrimaryKey };
    });

    let relationMatch;
    while ((relationMatch = relationRegex1.exec(rowsText)) !== null) {
      const [, fromColumn, direction, toTable, toColumn] = relationMatch;
      const relationKey = `${tableName}.${fromColumn}.${direction}.${toTable}.${toColumn}`;
      relationsSet.add(relationKey);
    }
  }

  let relationMatch;
  while ((relationMatch = relationRegex2.exec(dbml)) !== null) {
    const [, fromTable, fromColumn, direction, toTable, toColumn] =
      relationMatch;
    const relationKey = `${fromTable}.${fromColumn}.${direction}.${toTable}.${toColumn}`;
    relationsSet.add(relationKey);
  }

  // Convert the set back to an array of relations
  const relations = Array.from(relationsSet).map((relationKey) => {
    const [fromTable, fromColumn, direction, toTable, toColumn] =
      relationKey.split(".");
    return { fromTable, fromColumn, direction, toTable, toColumn };
  });

  console.log("Tables:", tables);
  console.log("Relations:", relations);

  return { tables, relations };
}

// Fonction pour créer une table à partir de la chaîne DBML
function createTable(tableName: string) {
  // Check if a table with the same name already exists
  const existingTable = figma.currentPage.findChild(
    (node) => node.name === "[TABLE] " + tableName && node.type === "FRAME"
  );

  let table;
  if (existingTable) {
    table = existingTable as FrameNode;
  } else {
    // Create a new AutoLayout frame for the table
    table = figma.createFrame();
    table.name = "[TABLE] " + tableName;
    table.layoutMode = "VERTICAL";
    table.primaryAxisSizingMode = "AUTO";
    table.counterAxisSizingMode = "AUTO";
    table.itemSpacing = 0;
    table.bottomRightRadius = 8;
    table.bottomLeftRadius = 8;
    table.topRightRadius = 8;
    table.topLeftRadius = 8;
    table.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    table.strokes = [{ type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.85 } }];
    table.effects = [
      {
        type: "DROP_SHADOW",
        radius: 2,
        visible: true,
        color: { r: 0, g: 0, b: 0, a: 0.05 },
        offset: { x: 0, y: 2 },
        spread: 0,
        blendMode: "NORMAL",
        showShadowBehindNode: false,
      },
      {
        type: "DROP_SHADOW",
        radius: 6,
        visible: true,
        color: { r: 0, g: 0, b: 0, a: 0.05 },
        offset: { x: 0, y: 6 },
        spread: 0,
        blendMode: "NORMAL",
        showShadowBehindNode: false,
      },
      {
        type: "DROP_SHADOW",
        radius: 12,
        visible: true,
        color: { r: 0, g: 0, b: 0, a: 0.05 },
        offset: { x: 0, y: 12 },
        spread: 0,
        blendMode: "NORMAL",
        showShadowBehindNode: false,
      },
    ];

    // Create title
    const titleText = figma.createText();
    titleText.characters = "🌐  " + tableName;
    titleText.fontSize = 16;
    titleText.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];

    //titleFrame
    const titleFrame = figma.createFrame();
    titleFrame.layoutMode = "HORIZONTAL";
    titleFrame.primaryAxisSizingMode = "AUTO";
    titleFrame.counterAxisSizingMode = "AUTO";
    titleFrame.name = tableName;
    titleFrame.itemSpacing = 0;
    titleFrame.paddingTop = 20;
    titleFrame.paddingBottom = 20;
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

function createRow(row: Row, table: FrameNode): FrameNode {
  const { name, type, isPrimaryKey } = row;
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
  nameText.characters = name + (isPrimaryKey ? " 🔑" : "");
  nameText.fontSize = 16;
  nameText.fills = [
    {
      type: "SOLID",
      color: isPrimaryKey ? { r: 0, g: 0, b: 0 } : { r: 0.3, g: 0.3, b: 0.3 },
    },
  ];

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
  typeText.fills = [{ type: "SOLID", color: { r: 0.55, g: 0.55, b: 0.55 } }];

  //typeFrame
  const typeFrame = figma.createFrame();
  typeFrame.layoutMode = "HORIZONTAL";
  typeFrame.primaryAxisSizingMode = "AUTO";
  typeFrame.counterAxisSizingMode = "AUTO";
  typeFrame.itemSpacing = 0;

  typeFrame.appendChild(typeText);
  rowFrame.appendChild(typeFrame);

  table.appendChild(rowFrame);

  return rowFrame;
}

function createConnector(from: SceneNode, to: SceneNode, direction: string) {
  const connector = figma.createConnector();
  connector.connectorStart = { endpointNodeId: from.id, magnet: "AUTO" };
  connector.connectorEnd = { endpointNodeId: to.id, magnet: "AUTO" };
  connector.strokeWeight = 2;
  connector.strokes = [
    {
      type: "SOLID",
      color: { r: 0.85, g: 0.85, b: 0.85 },
    },
  ];
  connector.strokeJoin = "ROUND";
  switch (direction) {
    case "-":
      connector.connectorStartStrokeCap = "NONE";
      connector.connectorEndStrokeCap = "NONE";
      break;
    case "<":
      connector.connectorStartStrokeCap = "NONE";
      connector.connectorEndStrokeCap = "TRIANGLE_FILLED";
      break;
    case ">":
      connector.connectorStartStrokeCap = "TRIANGLE_FILLED";
      connector.connectorEndStrokeCap = "NONE";
      break;
    case "<>":
      connector.connectorStartStrokeCap = "TRIANGLE_FILLED";
      connector.connectorEndStrokeCap = "TRIANGLE_FILLED";
      break;
  }
  // connector.stroke = { r: 0, g: 0, b: 0 };
  figma.currentPage.appendChild(connector);
}

function createTablesFromDBML(dbml: string) {
  const { tables, relations } = parseDBML(dbml);

  const tableMap: { [key: string]: FrameNode } = {};
  const rowMap: { [key: string]: { [key: string]: FrameNode } } = {};

  //remove deleted table
  figma.currentPage.children.forEach((node) => {
    if (
      node.type === "FRAME" &&
      node.name.startsWith("[TABLE]") &&
      !(node.name.replace("[TABLE] ", "") in tables)
    ) {
      node.remove();
    }
  });

  for (const tableName in tables) {
    const table = createTable(tableName);
    tableMap[tableName] = table;
    rowMap[tableName] = {};

    // Remove existing rows from the table
    table.children.forEach((child) => {
      if (child.name !== tableName) {
        child.remove();
      }
    });

    for (const row of tables[tableName]) {
      const rowFrame = createRow(row, table);
      rowMap[tableName][row.name] = rowFrame;
    }
  }

  for (const relation of relations) {
    const { fromTable, fromColumn, direction, toTable, toColumn } = relation;
    const fromRow = rowMap[fromTable]?.[fromColumn];
    const toRow = rowMap[toTable]?.[toColumn];

    if (fromRow && toRow) {
      createConnector(fromRow, toRow, direction);
    }
  }
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
      createTablesFromDBML(text);
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
      cornerRadius={20}
      effect={{
        type: "drop-shadow",
        color: { r: 0, g: 0, b: 0, a: 0.1 },
        offset: { x: 0, y: 4 },
        blur: 12,
        spread: 2,
      }}
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
