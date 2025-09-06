const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'tis_kis_erp';

const additionalEmployees = [
  {
    id: 'emp-006',
    fullName: 'Світлана Кравченко',
    firstName: 'Світлана',
    lastName: 'Кравченко',
    email: 'svitlana.kravchenko@novaposhta.ua',
    department: 'Кур\'єрська служба',
    position: 'Кур\'єр',
    employeeId: 'NP-006',
    phone: '+380501234568',
    isActive: true,
    hireDate: new Date('2023-08-01'),
    salary: 25000,
    accessLevel: 'courier'
  },
  {
    id: 'emp-007',
    fullName: 'Василь Коваль',
    firstName: 'Василь',
    lastName: 'Коваль',
    email: 'vasyl.koval@novaposhta.ua',
    department: 'Транспортний відділ',
    position: 'Водій',
    employeeId: 'NP-007',
    phone: '+380671234569',
    isActive: true,
    hireDate: new Date('2023-04-15'),
    salary: 28000,
    accessLevel: 'driver'
  },
  {
    id: 'emp-008',
    fullName: 'Ольга Бондаренко',
    firstName: 'Ольга',
    lastName: 'Бондаренко',
    email: 'olga.bondarenko@novaposhta.ua',
    department: 'HR відділ',
    position: 'HR менеджер',
    employeeId: 'NP-008',
    phone: '+380931234570',
    isActive: true,
    hireDate: new Date('2022-09-01'),
    salary: 40000,
    accessLevel: 'manager'
  },
  {
    id: 'emp-009',
    fullName: 'Сергій Левченко',
    firstName: 'Сергій',
    lastName: 'Левченко',
    email: 'serhiy.levchenko@novaposhta.ua',
    department: 'Фінанси',
    position: 'Бухгалтер',
    employeeId: 'NP-009',
    phone: '+380661234571',
    isActive: true,
    hireDate: new Date('2023-01-10'),
    salary: 32000,
    accessLevel: 'finance'
  },
  {
    id: 'emp-010',
    fullName: 'Тетяна Гриценко',
    firstName: 'Тетяна',
    lastName: 'Гриценко',
    email: 'tetyana.hrytsenko@novaposhta.ua',
    department: 'Відділення та обслуговування',
    position: 'Оператор відділення',
    employeeId: 'NP-010',
    phone: '+380771234572',
    isActive: true,
    hireDate: new Date('2023-06-20'),
    salary: 22000,
    accessLevel: 'branch'
  },
  {
    id: 'emp-011',
    fullName: 'Микола Шевченко',
    firstName: 'Микола',
    lastName: 'Шевченко',
    email: 'mykola.shevchenko@novaposhta.ua',
    department: 'IT відділ',
    position: 'Системний адміністратор',
    employeeId: 'NP-011',
    phone: '+380681234573',
    isActive: true,
    hireDate: new Date('2022-12-05'),
    salary: 45000,
    accessLevel: 'admin'
  },
  {
    id: 'emp-012',
    fullName: 'Юлія Романенко',
    firstName: 'Юлія',
    lastName: 'Романенко',
    email: 'yuliya.romanenko@novaposhta.ua',
    department: 'Кур\'єрська служба',
    position: 'Старший кур\'єр',
    employeeId: 'NP-012',
    phone: '+380951234574',
    isActive: true,
    hireDate: new Date('2022-10-15'),
    salary: 30000,
    accessLevel: 'courier'
  },
  {
    id: 'emp-013',
    fullName: 'Андрій Петров',
    firstName: 'Андрій',
    lastName: 'Петров',
    email: 'andriy.petrov@novaposhta.ua',
    department: 'Складська логістика',
    position: 'Завідувач складу',
    employeeId: 'NP-013',
    phone: '+380731234575',
    isActive: true,
    hireDate: new Date('2021-08-01'),
    salary: 38000,
    accessLevel: 'supervisor'
  },
  {
    id: 'emp-014',
    fullName: 'Катерина Лисенко',
    firstName: 'Катерина',
    lastName: 'Лисенко',
    email: 'kateryna.lysenko@novaposhta.ua',
    department: 'Маркетинг',
    position: 'Маркетинг менеджер',
    employeeId: 'NP-014',
    phone: '+380841234576',
    isActive: true,
    hireDate: new Date('2023-02-14'),
    salary: 35000,
    accessLevel: 'manager'
  },
  {
    id: 'emp-015',
    fullName: 'Ігор Мороз',
    firstName: 'Ігор',
    lastName: 'Мороз',
    email: 'ihor.moroz@novaposhta.ua',
    department: 'Служба безпеки',
    position: 'Охоронець',
    employeeId: 'NP-015',
    phone: '+380911234577',
    isActive: true,
    hireDate: new Date('2023-07-01'),
    salary: 24000,
    accessLevel: 'security'
  }
];

async function addMoreEmployees() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Підключено до MongoDB');
    
    const db = client.db(dbName);
    const employeesCollection = db.collection('employees');
    const timesheetCollection = db.collection('timesheet_entries');
    
    // Add new employees
    const result = await employeesCollection.insertMany(additionalEmployees);
    console.log(`Додано ${result.insertedCount} нових співробітників`);
    
    // Generate timesheet data for new employees
    const currentMonth = 9; // September
    const currentYear = 2025;
    const daysInMonth = 30;
    
    const timesheetEntries = [];
    
    additionalEmployees.forEach(employee => {
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth - 1, day);
        const dayOfWeek = date.getDay();
        
        let status, workHours, dayType, absenceType = null;
        
        // Weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          status = 'absent';
          workHours = 0;
          dayType = 'weekend';
        } else {
          // Random work patterns
          const rand = Math.random();
          if (rand > 0.95) {
            status = 'absent';
            workHours = 0;
            dayType = 'work';
            absenceType = 'sick';
          } else if (rand > 0.90) {
            status = 'absent';
            workHours = 0;
            dayType = 'work';
            absenceType = 'vacation';
          } else if (rand > 0.85) {
            status = 'present';
            workHours = 10;
            dayType = 'work';
          } else {
            status = 'present';
            workHours = 8;
            dayType = 'work';
          }
        }
        
        timesheetEntries.push({
          id: `ts-${employee.id}-${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          employeeId: employee.id,
          date: date.toISOString(),
          dayType,
          status,
          workHours,
          overtime: workHours > 8 ? workHours - 8 : 0,
          absenceType,
          comments: '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });
    
    const timesheetResult = await timesheetCollection.insertMany(timesheetEntries);
    console.log(`Додано ${timesheetResult.insertedCount} записів табеля`);
    
    console.log('🎉 Додаткові дані для табеля успішно додані!');
    
  } catch (error) {
    console.error('❌ Помилка:', error);
  } finally {
    await client.close();
  }
}

addMoreEmployees();