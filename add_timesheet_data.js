const { MongoClient } = require('mongodb');

async function addTimesheetData() {
  const client = new MongoClient(process.env.MONGO_URL || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('tis_kis_erp');
    
    // Додаємо тестових співробітників
    const employees = [
      {
        id: 'emp-001',
        fullName: 'Іван Петренко',
        firstName: 'Іван',
        lastName: 'Петренко',
        email: 'ivan.petrenko@novaposhta.ua',
        department: 'Логістика та доставка',
        position: 'Кур'єр',
        employeeId: 'NP-001',
        phone: '+380501234567',
        isActive: true,
        hireDate: new Date('2023-01-15'),
        salary: 25000,
        accessLevel: 'basic'
      },
      {
        id: 'emp-002',
        fullName: 'Марія Коваленко',
        firstName: 'Марія',
        lastName: 'Коваленко',
        email: 'maria.kovalenko@novaposhta.ua',
        department: 'Відділення та обслуговування',
        position: 'Оператор відділення',
        employeeId: 'NP-002',
        phone: '+380671234567',
        isActive: true,
        hireDate: new Date('2023-03-20'),
        salary: 22000,
        accessLevel: 'branch'
      },
      {
        id: 'emp-003',
        fullName: 'Олександр Мельник',
        firstName: 'Олександр',
        lastName: 'Мельник',
        email: 'oleksandr.melnyk@novaposhta.ua',
        department: 'Складська логістика',
        position: 'Складський працівник',
        employeeId: 'NP-003',
        phone: '+380631234567',
        isActive: true,
        hireDate: new Date('2023-05-10'),
        salary: 20000,
        accessLevel: 'warehouse'
      },
      {
        id: 'emp-004',
        fullName: 'Анна Сидоренко',
        firstName: 'Анна',
        lastName: 'Сидоренко',
        email: 'anna.sydorenko@novaposhta.ua',
        department: 'Логістика та доставка',
        position: 'Менеджер логістики',
        employeeId: 'NP-004',
        phone: '+380971234567',
        isActive: true,
        hireDate: new Date('2022-11-15'),
        salary: 35000,
        accessLevel: 'manager'
      },
      {
        id: 'emp-005',
        fullName: 'Дмитро Іваненко',
        firstName: 'Дмитро',
        lastName: 'Іваненко',
        email: 'dmytro.ivanenko@novaposhta.ua',
        department: 'Відділення та обслуговування',
        position: 'Старший оператор',
        employeeId: 'NP-005',
        phone: '+380501234568',
        isActive: true,
        hireDate: new Date('2023-07-01'),
        salary: 28000,
        accessLevel: 'branch'
      }
    ];

    // Очистимо та додамо співробітників
    await db.collection('employees').deleteMany({});
    await db.collection('employees').insertMany(employees);
    console.log(`Додано ${employees.length} співробітників`);

    // Додаємо тестові записи табеля для вересня 2025
    const timesheetEntries = [];
    const employeeIds = employees.map(e => e.id);
    const year = 2025;
    const month = 8; // September (0-based)

    for (let day = 1; day <= 30; day++) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();

      employeeIds.forEach(empId => {
        // Пропускаємо вихідні дні (субота, неділя)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return;
        }

        let workHours = 8;
        let overtime = 0;
        let absenceType = null;
        let status = 'present';
        let comments = '';

        // Додамо деяку варіацію
        if (Math.random() < 0.1) { // 10% шанс на відсутність
          const absenceTypes = ['sick', 'vacation', 'business_trip'];
          absenceType = absenceTypes[Math.floor(Math.random() * absenceTypes.length)];
          workHours = 0;
          status = absenceType;
          
          if (absenceType === 'sick') comments = 'Лікарняний';
          else if (absenceType === 'vacation') comments = 'Відпустка';
          else if (absenceType === 'business_trip') comments = 'Відрядження';
        } else if (Math.random() < 0.2) { // 20% шанс на понадурочні
          overtime = Math.floor(Math.random() * 3) + 1;
          comments = 'Понадурочні роботи';
        }

        timesheetEntries.push({
          id: `ts-${empId}-${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
          employeeId: empId,
          date: currentDate,
          workHours: workHours,
          overtime: overtime,
          absenceType: absenceType,
          status: status,
          comments: comments,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    }

    // Очистимо та додамо записи табеля
    await db.collection('timesheet_entries').deleteMany({});
    await db.collection('timesheet_entries').insertMany(timesheetEntries);
    console.log(`Додано ${timesheetEntries.length} записів табеля`);

    console.log('Тестові дані для табеля успішно додані!');
    
  } catch (error) {
    console.error('Помилка додавання даних:', error);
  } finally {
    await client.close();
  }
}

addTimesheetData();